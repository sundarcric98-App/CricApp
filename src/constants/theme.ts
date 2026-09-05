import Colors from './colors';

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    gutter: 16,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  typography: {
    headlineLg: {
      fontSize: 26,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    headlineMd: {
      fontSize: 20,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    headlineSm: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    displayScore: {
      fontSize: 34,
      fontWeight: '800' as const,
      letterSpacing: -1,
    },
    statNumeric: {
      fontSize: 16,
      fontWeight: '700' as const,
    },
    statNumericSm: {
      fontSize: 13,
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodyMd: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    bodySm: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    labelCaps: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
    badgeLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    glowGreen: {
      shadowColor: '#4EDEA3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    glowAmber: {
      shadowColor: '#FFB95F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export default Theme;
