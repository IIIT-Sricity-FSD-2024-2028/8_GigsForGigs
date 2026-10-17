export const colors = {
  // Primary Blue
  primary: '#0D568D',
  primaryDark: '#084875',
  primaryLight: '#2F6F9F',
  primaryOutlineHover: '#E4EEF5',

  // Orange (Main Accent / CTA)
  orange: '#B45F00',
  orangeDark: '#9A5100',
  orangeLight: '#F6E6D3',
  accent: '#B45F00',
  accentDark: '#9A5100',
  accentLight: '#F6E6D3',

  // Neutral Background & Surface
  background: '#F2F6F8',
  surface: '#FFFFFF',

  // Text Colors
  textPrimary: '#1B2A36',
  headingBlue: '#0D568D',
  textSecondary: '#475764',
  textMuted: '#5E6E7A',

  // Muted Teal / Green System (Success)
  success: '#367D6F',
  successSoft: '#E4F2EF',
  badgeSuccessText: '#2E6E62',

  // Error / Danger System
  danger: '#C94C4C',
  dangerDark: '#A63838',
  dangerSoft: '#F8E8E8',

  // Warning System
  warning: '#B45F00',
  warningSoft: '#F8EBD9',
  warningText: '#9A5100',

  // Information System
  info: '#0D568D',
  infoSoft: '#E4EEF5',

  // Sidebar Tokens
  sidebarBg: '#0D568D',
  sidebarText: '#FFFFFF',
  sidebarInactiveText: '#B8D0E0',
  sidebarActiveBg: '#1D6399',
  sidebarActiveText: '#FFFFFF',
  sidebarActiveIndicator: '#B45F00',
  sidebarHover: '#16609A',

  // Logout Tokens
  logoutBg: '#B45F00',
  logoutHover: '#9A5100',

  // Borders & Progress
  borderDefault: '#DCE3E8',
  borderInput: '#D3DCE2',
  borderSecondaryButton: '#D8D8D8',
  progressTrack: '#DCE3E8',
  progressFill: '#0D568D',
  progressCompleted: '#367D6F',
} as const;

export const statusColors = {
  ACTIVE: { bg: '#E4F2EF', text: '#2E6E62' },
  COMPLETED: { bg: '#E4F2EF', text: '#2E6E62' },
  APPROVED: { bg: '#E4F2EF', text: '#2E6E62' },
  OPEN: { bg: '#E4F2EF', text: '#2E6E62' },

  PENDING: { bg: '#F8EBD9', text: '#9A5100' },
  REQUIRES_ACTION: { bg: '#F8EBD9', text: '#9A5100' },

  IN_PROGRESS: { bg: '#E4EEF5', text: '#0D568D' },

  CANCELLED: { bg: '#F8E8E8', text: '#A63838' },
  REJECTED: { bg: '#F8E8E8', text: '#A63838' },
  DECLINED: { bg: '#F8E8E8', text: '#A63838' },
} as const;

export default colors;
