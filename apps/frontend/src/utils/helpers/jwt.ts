/**
 * Minimal JWT payload decode (no signature verification — the server is the
 * source of truth for validity; the frontend only reads claims to route by
 * role and to know which ids to use in URLs).
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
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
