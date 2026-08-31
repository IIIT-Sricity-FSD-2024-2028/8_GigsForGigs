/**
 * Validates required environment variables once at boot, so a missing
 * secret fails loudly at startup instead of surfacing as a confusing 500
 * the first time a token is signed or verified.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "gigsforgigs-jwt-dev-secret-super-secure-2026"),
  port: Number(process.env.PORT ?? 5000),
};
