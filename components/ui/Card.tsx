import { useState } from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { colors, shadow } from '@/lib/theme';

type Props = ViewProps & {
  /** Quando passado, o card vira interativo (Pressable). */
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
  /** Realça com sombra mais forte — use em CTAs principais. */
  emphasis?: 'soft' | 'strong';
  className?: string;
};

/**
 * Card padrão do app. Pode ser interativo (Pressable) ou estático (View).
 *
 * IMPLEMENTAÇÃO: a versão interativa usa style STÁTICO com `useState`
 * pra controle do pressed, em vez de `style={({pressed}) => […]}`. A
 * versão antiga com array+função falhava no Android + new arch (Fabric):
 * cores customizadas passadas via prop `style` não eram aplicadas na
 * primeira renderização, deixando CTAs com fundo sage praticamente
 * invisíveis.
 */
export function Card({
  onPress,
  accessibilityLabel,
  emphasis = 'soft',
  className = '',
  style,
  children,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);

  const baseStyle = {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.creamDark,
    ...(emphasis === 'strong' ? shadow.card : {}),
  } as const;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className={className}
        style={[baseStyle, { opacity: pressed ? 0.85 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={className} style={[baseStyle, style]} {...rest}>
      {children}
    </View>
  );
}
