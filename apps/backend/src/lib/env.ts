/**
 * Validates required environment variables once at boot, so a missing
 * secret fails loudly at startup instead of surfacing as a confusing 500
 * the first time a token is signed or verified.
 */
const isProduction = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name] || (isProduction ? undefined : devFallback);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const jwtSecret = required("JWT_SECRET", "gigsforgigs-jwt-dev-secret-not-for-production");
if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

const list = (raw: string | undefined) =>
  (raw ?? "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

const appUrl = (process.env.APP_URL || (isProduction ? "" : "http://localhost:5173")).replace(/\/$/, "");
if (isProduction && !appUrl) {
  throw new Error("Missing required env var: APP_URL (public frontend URL, used in invite links)");
}

export const env = {
  isProduction,
  databaseUrl: required("DATABASE_URL", "postgresql://postgres@127.0.0.1:5433/gigsforge"),
  jwtSecret,
  port: Number(process.env.PORT),
  /** Public frontend origin, used to build invite links. */
  appUrl,
  /** Browser origins allowed by CORS. Defaults to APP_URL. */
  corsOrigins: list(process.env.CORS_ORIGINS).length > 0 ? list(process.env.CORS_ORIGINS) : [appUrl],
  /** Number of reverse proxies in front of the app (for correct client IPs in rate limiting). */
  trustProxy: Number(process.env.TRUST_PROXY ?? (isProduction ? 1 : 0)),
};
