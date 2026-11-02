/**
 * Minimal JWT payload decode (no signature verification — the server is the
 * source of truth for validity; the frontend only reads claims to route by
 * role and to know which ids to use in URLs).
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    // A JWT is header.payload.signature — we only need the middle part.
    const [, payload] = token.split('.');
    if (!payload) return null;
    // JWTs use URL-safe base64 without padding; convert to normal base64 for atob().
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // atob() gives a byte string; this round-trip decodes it as UTF-8 so non-ASCII names survive.
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
