import { StyleSheet, Appearance } from 'react-native';

export const getColors = (isDark: boolean) => ({
  // ── brand ────────────────────────────────
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  accent: '#f59e0b',

  // ── backgrounds ──────────────────────────
  background: isDark ? '#0f0f1a' : '#f4f4fb',
  card: isDark ? '#1a1a2e' : '#ffffff',
  surface: isDark ? '#16213e' : '#eef0fb',

  // ── text ─────────────────────────────────
  textPrimary: isDark ? '#e8e8ff' : '#1a1a2e',
  textSecondary: isDark ? '#a0a0c0' : '#4a4a6a',
  textMuted: isDark ? '#606080' : '#9090b0',
  textOnPrimary: '#ffffff',

  // ── status ───────────────────────────────
  success: '#22c55e',
  successBg: isDark ? '#052e16' : '#dcfce7',
  error: '#ef4444',
  errorBg: isDark ? '#2d0a0a' : '#fee2e2',
  warning: '#f59e0b',
  warningBg: isDark ? '#2d1f00' : '#fef3c7',
  info: '#6366f1',
  infoBg: isDark ? '#1e1b4b' : '#e0e7ff',

  // ── ui ───────────────────────────────────
  border: isDark ? '#2a2a4a' : '#e2e2f0',
  disabled: isDark ? '#2a2a3a' : '#d1d5db',
  disabledText: isDark ? '#505070' : '#9ca3af',
  shadow: isDark ? '#000000' : '#6366f1',
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// ── helper — call this in every screen ───────────────────────────
export const getGlobalStyles = (isDark: boolean) => {
  const colors = getColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.md,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: 24,
      fontWeight: '800' as const,
      color: colors.textPrimary,
      marginBottom: spacing.md,
      letterSpacing: 0.3,
    },
    subheading: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    mutedText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    empty: {
      textAlign: 'center' as const,
      color: colors.textMuted,
      marginTop: spacing.xl,
      fontSize: 14,
    },
    accentText: {
      color: colors.accent,
      fontWeight: '700' as const,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    btnPrimaryText: {
      color: colors.textOnPrimary,
      fontWeight: '700' as const,
      fontSize: 15,
      letterSpacing: 0.3,
    },
    btnSecondary: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center' as const,
      backgroundColor: 'transparent',
    },
    btnSecondaryText: {
      color: colors.primary,
      fontWeight: '600' as const,
      fontSize: 15,
    },
    btnDisabled: {
      backgroundColor: colors.disabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    btnAccent: {
      backgroundColor: colors.accent,
      padding: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center' as const,
    },
    btnAccentText: {
      color: '#1a1a2e',
      fontWeight: '700' as const,
      fontSize: 15,
    },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
    },
    badgePending: {
      backgroundColor: colors.warningBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    badgePendingText: {
      color: colors.warning,
      fontSize: 11,
      fontWeight: '700' as const,
    },
    badgeShipped: {
      backgroundColor: colors.infoBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    badgeShippedText: {
      color: colors.info,
      fontSize: 11,
      fontWeight: '700' as const,
    },
    badgeDelivered: {
      backgroundColor: colors.successBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    badgeDeliveredText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '700' as const,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
  });
};