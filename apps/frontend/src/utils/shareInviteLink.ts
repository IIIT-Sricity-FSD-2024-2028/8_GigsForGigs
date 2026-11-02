/**
 * Invites aren't emailed (no external services yet), so the inviter has to
 * hand the one-time link over themselves. Copies it to the clipboard when
 * possible and always shows it in a copyable prompt.
 */
export function shareInviteLink(link: string | undefined, notify: (message: string) => void): void {
  if (!link) {
    notify('Invite created. Open your manager list to copy the activation link.');
    return;
  }
  // Clipboard API can be missing (non-HTTPS) or denied; the prompt below still shows the link.
  navigator.clipboard?.writeText(link).catch(() => {});
  window.prompt('Invite created. Share this one-time activation link with your manager (copied to clipboard):', link);
}
