/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30s), the parameters every authenticator app
 * uses, built on node:crypto so a security path carries no extra dependency.
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

export function base32Encode(bytes: Buffer): string {
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  return (bits.match(/.{1,5}/g) ?? []).map((chunk) => BASE32[parseInt(chunk.padEnd(5, "0"), 2)]).join("");
}

function base32Decode(text: string): Buffer {
  let bits = "";
  for (const char of text) bits += BASE32.indexOf(char).toString(2).padStart(5, "0");
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
}

/** The 6-digit code for one 30-second step (RFC 4226 dynamic truncation). */
export function hotp(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

export const newTotpSecret = (): string => base32Encode(randomBytes(20));

/**
 * Checks a code against the current step and one either side, tolerating about
 * 30s of phone clock drift. Non-6-digit input fails before any crypto runs.
 *
 * ponytail: a code can be replayed inside its ~90s window. Store the last used
 * step per user if that window ever matters; the login rate limiter caps guessing.
 */
export function verifyTotp(secret: string, code: unknown, nowMs = Date.now()): boolean {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return false;
  const step = Math.floor(nowMs / 1000 / STEP_SECONDS);
  return [step - 1, step, step + 1].some((s) =>
    timingSafeEqual(Buffer.from(hotp(secret, s)), Buffer.from(code)),
  );
}

// The secret must be readable (unlike a password hash) to compute codes, so it
// is encrypted at rest: a database leak alone doesn't yield working 2FA seeds.
// Rotating JWT_SECRET makes stored secrets undecryptable, so admins re-enroll.
const encryptionKey = () => createHash("sha256").update(`totp:${env.jwtSecret}`).digest();

export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(stored: string): string {
  const [iv, tag, body] = stored.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
}
