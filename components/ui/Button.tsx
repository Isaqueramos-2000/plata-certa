import { useState } from 'react';
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
 * IMPLEMENTAÇÃO: usa style STÁTICO (objeto, não função) com `useState`
 * pra controle do pressed. A versão antiga com `style={({pressed}) => …}`
 * falhava no Android + new arch (Fabric): o callback era processado mas
 * a cor de fundo não era aplicada na primeira renderização, deixando
 * o botão "invisível" (mesma cor do parent).
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
  const [pressed, setPressed] = useState(false);

  const height = size === 'lg' ? minTouch + 8 : minTouch;
  const paddingHorizontal = size === 'lg' ? 24 : 18;
  const textTone = VARIANT_TEXT_TONE[variant];
  // Em modo acessível ícones ganham um pouco de tamanho extra também.
  const iconSize = accessible ? 22 : 20;

  const bgColor = disabled
    ? colors.creamDark
    : pressed
      ? VARIANT_BG_PRESSED[variant]
      : VARIANT_BG[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        height,
        paddingHorizontal,
        borderRadius: 12,
        backgroundColor: bgColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
        borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
        borderColor: colors.creamDark,
        ...(fullWidth ? { alignSelf: 'stretch' as const } : null),
      }}
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
