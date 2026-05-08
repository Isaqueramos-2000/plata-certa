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

export function Card({
  onPress,
  accessibilityLabel,
  emphasis = 'soft',
  className = '',
  style,
  children,
  ...rest
}: Props) {
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
        className={className}
        style={({ pressed }) => [
          baseStyle,
          { opacity: pressed ? 0.85 : 1 },
          style as object,
        ]}
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
