export const colors = {
  // Primary Blue
  primary: '#0D568D',
  primaryDark: '#084875',
  primaryLight: '#2F6F9F',
  primaryOutlineHover: '#E4EEF5',

  // Orange (Main Accent / CTA)
  orange: '#D47700',
  orangeDark: '#B86300',
  orangeLight: '#F4E3CF',
  accent: '#D47700',
  accentDark: '#B86300',
  accentLight: '#F4E3CF',

  // Neutral Background & Surface
  background: '#EFF6F7',
  surface: '#FFFFFF',

  // Text Colors
  textPrimary: '#3A1F16',
  headingBlue: '#0D568D',
  textSecondary: '#76594F',
  textMuted: '#927D74',

  // Muted Teal / Green System (Success)
  success: '#55A99A',
  successSoft: '#E4F2EF',
  badgeSuccessText: '#438F82',

  // Error / Danger System
  danger: '#C94C4C',
  dangerDark: '#A63838',
  dangerSoft: '#F8E8E8',

  // Warning System
  warning: '#D47700',
  warningSoft: '#F8EBD9',
  warningText: '#B86300',

  // Information System
  info: '#0D568D',
  infoSoft: '#E4EEF5',

  // Sidebar Tokens
  sidebarBg: '#0D568D',
  sidebarText: '#FFFFFF',
  sidebarInactiveText: '#B8D0E0',
  sidebarActiveBg: '#1F6598',
  sidebarActiveText: '#FFFFFF',
  sidebarActiveIndicator: '#D47700',
  sidebarHover: '#1F6598',

  // Logout Tokens
  logoutBg: '#D47700',
  logoutHover: '#B86300',

  // Borders & Progress
  borderDefault: '#D9E0E3',
  borderInput: '#D5DDE0',
  borderSecondaryButton: '#D8D8D8',
  progressTrack: '#D9E0E3',
  progressFill: '#0D568D',
  progressCompleted: '#55A99A',
} as const;

export const statusColors = {
  ACTIVE: { bg: '#E4F2EF', text: '#438F82' },
  COMPLETED: { bg: '#E4F2EF', text: '#438F82' },
  APPROVED: { bg: '#E4F2EF', text: '#438F82' },
  OPEN: { bg: '#E4F2EF', text: '#438F82' },

  PENDING: { bg: '#F8EBD9', text: '#B86300' },
  REQUIRES_ACTION: { bg: '#F8EBD9', text: '#B86300' },

  IN_PROGRESS: { bg: '#E4EEF5', text: '#0D568D' },

  CANCELLED: { bg: '#F8E8E8', text: '#C94C4C' },
  REJECTED: { bg: '#F8E8E8', text: '#C94C4C' },
  DECLINED: { bg: '#F8E8E8', text: '#C94C4C' },
} as const;

export default colors;
