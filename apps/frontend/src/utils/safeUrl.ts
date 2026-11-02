/**
 * Returns the URL only if it is an absolute http(s) link, otherwise undefined.
 * Use for every user-supplied href/src: blocks javascript:, data:, vbscript:
 * and other schemes even for rows saved before server-side URL validation.
 */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
