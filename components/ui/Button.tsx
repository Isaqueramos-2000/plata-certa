import { Pressable, View, type PressableProps } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { useSettingsStore, useTouchTarget } from '@/stores/settingsStore';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Nome do ícone SF/Material conforme components/ui/icon-symbol.tsx */
  iconLeft?: Parameters<typeof IconSymbol>[0]['name'];
  iconRight?: Parameters<typeof IconSymbol>[0]['name'];
  fullWidth?: boolean;
};

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.sage,
  secondary: colors.creamDark,
  ghost: 'transparent',
  danger: colors.danger,
};

const VARIANT_BG_PRESSED: Record<Variant, string> = {
  primary: colors.sageDark,
  secondary: '#E5DFD2',
  ghost: colors.creamDark,
  danger: '#7E2F22',
};

const VARIANT_TEXT_TONE: Record<Variant, 'inverse' | 'default'> = {
  primary: 'inverse',
  secondary: 'default',
  ghost: 'default',
  danger: 'inverse',
};

/**
 * Botão acessível com 4 variantes. Tamanho mínimo de toque vem do
 * settingsStore (48dp padrão / 56dp acessível) — sempre maior que
 * o exigido pelas guidelines de iOS/Android.
 *
 * Não usamos `className` aqui: o NativeWind v4 descarta o callback
 * de `style={({pressed}) => …}` do Pressable quando combinado com
 * className, deixando o botão sem altura/cor de fundo. Por isso todo
 * o styling sai por inline style.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled,
  ...rest
}: Props) {
  const minTouch = useTouchTarget();
  const accessible = useSettingsStore((s) => s.mode === 'accessible');

  const height = size === 'lg' ? minTouch + 8 : minTouch;
  const paddingHorizontal = size === 'lg' ? 24 : 18;
  const textTone = VARIANT_TEXT_TONE[variant];
  // Em modo acessível ícones ganham um pouco de tamanho extra também.
  const iconSize = accessible ? 22 : 20;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => ({
        height,
        paddingHorizontal,
        borderRadius: 12,
        backgroundColor: disabled
          ? colors.creamDark
          : pressed
            ? VARIANT_BG_PRESSED[variant]
            : VARIANT_BG[variant],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
        borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
        borderColor: colors.creamDark,
        // Em fullWidth a gente força stretch. Sem fullWidth, deixamos
        // o pai controlar o alinhamento (center/flex-start/etc).
        ...(fullWidth ? { alignSelf: 'stretch' as const } : null),
      })}
      {...rest}
    >
      {iconLeft ? (
        <View style={{ marginRight: 8 }}>
          <IconSymbol
            name={iconLeft}
            size={iconSize}
            color={textTone === 'inverse' ? colors.cream : colors.ink}
          />
        </View>
      ) : null}
      <Body tone={textTone} style={{ fontWeight: '600' }}>
        {label}
      </Body>
      {iconRight ? (
        <View style={{ marginLeft: 8 }}>
          <IconSymbol
            name={iconRight}
            size={iconSize}
            color={textTone === 'inverse' ? colors.cream : colors.ink}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
