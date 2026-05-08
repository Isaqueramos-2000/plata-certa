import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useFontScale, useSettingsStore } from '@/stores/settingsStore';
import { colors } from '@/lib/theme';

type Tone = 'default' | 'soft' | 'mute' | 'inverse' | 'danger';

type BaseProps = Omit<RNTextProps, 'style'> & {
  tone?: Tone;
  className?: string;
  style?: RNTextProps['style'];
};

type HeadingProps = BaseProps & { level?: 1 | 2 | 3 };
type BodyProps = BaseProps & { size?: 'default' | 'large' | 'small' };

const HEADING_SIZE = { 1: 32, 2: 24, 3: 20 } as const;
const BODY_SIZE = { default: 16, large: 18, small: 14 } as const;

/**
 * Resolve a cor do texto considerando o modo acessível.
 * Em modo acessível usamos pretos mais cheios e mute mais escuro
 * para atingir contraste WCAG AAA contra o fundo cream.
 */
function useToneColor(tone: Tone): string {
  const accessible = useSettingsStore((s) => s.mode === 'accessible');

  switch (tone) {
    case 'default':
      return accessible ? '#000000' : colors.ink;
    case 'soft':
      return accessible ? colors.ink : colors.inkSoft;
    case 'mute':
      return accessible ? colors.inkSoft : colors.inkMute;
    case 'inverse':
      return colors.cream;
    case 'danger':
      return colors.danger;
  }
}

/**
 * Título em serifa (Fraunces). Use para hierarquia visual de telas.
 * O tamanho escala automaticamente em modo acessível.
 */
export function Heading({
  level = 2,
  tone = 'default',
  className = '',
  style,
  children,
  ...rest
}: HeadingProps) {
  const scale = useFontScale();
  const color = useToneColor(tone);

  return (
    <RNText
      accessibilityRole="header"
      // O `font-display` aplica a Fraunces; o tamanho vem inline porque
      // dependemos do scale em runtime.
      className={`font-display ${className}`}
      style={[{ fontSize: HEADING_SIZE[level] * scale, color, lineHeight: HEADING_SIZE[level] * scale * 1.2 }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/**
 * Texto de corpo em Inter. Variante `large` para destaques calmos,
 * `small` para metadados e legendas.
 */
export function Body({
  size = 'default',
  tone = 'default',
  className = '',
  style,
  children,
  ...rest
}: BodyProps) {
  const scale = useFontScale();
  const color = useToneColor(tone);

  return (
    <RNText
      className={`font-sans ${className}`}
      style={[{ fontSize: BODY_SIZE[size] * scale, color, lineHeight: BODY_SIZE[size] * scale * 1.5 }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/** Texto pequeno em Inter para legendas/hints. */
export function Caption({
  tone = 'mute',
  className = '',
  style,
  children,
  ...rest
}: BaseProps) {
  const scale = useFontScale();
  const color = useToneColor(tone);

  return (
    <RNText
      className={`font-sans ${className}`}
      style={[{ fontSize: 12 * scale, color, lineHeight: 12 * scale * 1.4 }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
