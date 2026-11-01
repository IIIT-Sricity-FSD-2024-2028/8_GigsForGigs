import type { TokenPayload } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      /** Live account facts authGuard re-read from the DB for this request. */
      account?: { email: string; adminTier: string | null; adminPermissions: string[] };
    }
  }
}

export {};
