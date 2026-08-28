/**
 * Validates required environment variables once at boot, so a missing
 * secret fails loudly at startup instead of surfacing as a confusing 500
 * the first time a token is signed or verified.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT ?? 3000),
};
