import jwt from "jsonwebtoken";
import { env } from "./env.js";

export type Role = "client" | "gig_professional" | "manager" | "admin";

export interface ClientTokenPayload {
  role: "client";
  userId: number;
  clientId: number;
}

export interface ManagerTokenPayload {
  role: "manager";
  userId: number;
  managerId: number;
  clientId: number;
}

export interface GigTokenPayload {
  role: "gig_professional";
  userId: number;
  gigProfileId: number;
}

export interface AdminTokenPayload {
  role: "admin";
  userId: number;
}

export type TokenPayload =
  | ClientTokenPayload
  | ManagerTokenPayload
  | GigTokenPayload
  | AdminTokenPayload;

const EXPIRES_IN = "7d";
const SESSION_AUDIENCE = "session";

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { algorithm: "HS256", expiresIn: EXPIRES_IN, audience: SESSION_AUDIENCE });
}

/** Rejects anything that isn't a session token (e.g. an invite token signed with the same secret). */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"], audience: SESSION_AUDIENCE }) as TokenPayload;
}

// ---- One-time invite tokens -------------------------------------------------
// Stateless and signed, so no schema change is needed to hold them. Each one
// is bound to a purpose (audience) and the invite/user row it was issued for;
// the accept handlers re-check that row in the DB, so a token stops working as
// soon as the invite is accepted/revoked.

export type InvitePurpose = "manager_invite" | "admin_invite";

export interface InviteTokenPayload {
  email: string;
  /** ManagerInvite.inviteId or the provisioned admin User.userId. */
  ref: number;
}

export function signInviteToken(purpose: InvitePurpose, payload: InviteTokenPayload, expiresIn: `${number}d` | `${number}h`): string {
  return jwt.sign(payload, env.jwtSecret, { algorithm: "HS256", expiresIn, audience: purpose });
}

export function verifyInviteToken(purpose: InvitePurpose, token: string): InviteTokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"], audience: purpose }) as InviteTokenPayload;
  } catch {
    return null;
  }
}
