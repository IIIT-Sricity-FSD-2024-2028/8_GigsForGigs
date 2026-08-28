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

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  // jwt.verify returns a plain decoded object at the type level; the shape
  // is only as trustworthy as what signToken puts in, which is exhaustively
  // typed above.
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
