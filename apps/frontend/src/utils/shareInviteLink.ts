/** Invites aren't emailed (no external services yet); best-effort copy to clipboard. Clipboard API can be missing (non-HTTPS) or denied, so this silently no-ops on failure — the link is always shown in a card either way. */
export function copyInviteLink(link: string): void {
  navigator.clipboard?.writeText(link).catch(() => {});
}
