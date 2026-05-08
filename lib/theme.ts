/**
 * Design tokens — fonte de verdade do design system.
 *
 * Mantenha em sincronia com tailwind.config.js: ali ficam as classes
 * utilitárias; aqui ficam os valores que precisamos consumir em código
 * (StyleSheet, animações, navegação, etc.).
 */

export const colors = {
  sage: '#2D5F3F',
  sageLight: '#A8C9A4',
  sageDark: '#1F4530',
  terracotta: '#C97B4F',
  terracottaLight: '#E0A584',
  cream: '#FAF7F2',
  creamDark: '#F0EBE2',
  ink: '#1A1F1B',
  inkSoft: '#4A524C',
  inkMute: '#7A8478',
  white: '#FFFFFF',
  // Status semântico
  success: '#2D5F3F',
  warning: '#C97B4F',
  danger: '#9B3B2A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 8,
  btn: 12,
  card: 16,
  pill: 999,
} as const;

/**
 * Fontes: o tamanho base muda no modo acessível (settingsStore).
 * Estes valores são para o modo padrão; o modo acessível aplica multiplicador.
 */
export const fontSize = {
  caption: 12,
  small: 14,
  body: 16,
  bodyLg: 18,
  h3: 20,
  h2: 24,
  h1: 32,
  display: 40,
} as const;

export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const shadow = {
  card: {
    shadowColor: colors.sageDark,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: colors.sageDark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

/** Área mínima de toque — WCAG / Apple HIG / Material Design */
export const minTouchTarget = 48;

export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
