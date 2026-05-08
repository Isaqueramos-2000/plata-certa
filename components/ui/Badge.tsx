import { View, type ViewProps } from 'react-native';

import { Caption } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

type Props = Omit<ViewProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  className?: string;
};

const VARIANT: Record<
  Variant,
  { bg: string; fg: string }
> = {
  success: { bg: '#E1ECDF', fg: colors.sageDark },
  warning: { bg: '#F6E1D2', fg: '#7A4322' },
  danger: { bg: '#F4D7D1', fg: colors.danger },
  neutral: { bg: colors.creamDark, fg: colors.inkSoft },
  info: { bg: '#DCE8E1', fg: colors.sageDark },
};

/**
 * Badge para status, tags, e o nível de confiança da identificação
 * (high → success, medium → warning, low → danger).
 */
export function Badge({ label, variant = 'neutral', className = '', ...rest }: Props) {
  const { bg, fg } = VARIANT[variant];
  return (
    <View
      accessibilityRole="text"
      className={`self-start ${className}`}
      style={{
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
      {...rest}
    >
      <Caption style={{ color: fg, fontWeight: '600' }}>{label}</Caption>
    </View>
  );
}
