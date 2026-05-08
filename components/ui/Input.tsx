import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Body, Caption } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { useFontScale, useTouchTarget } from '@/stores/settingsStore';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  errorMessage?: string;
  className?: string;
};

export function Input({
  label,
  hint,
  errorMessage,
  className = '',
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const minHeight = useTouchTarget();
  const scale = useFontScale();
  const hasError = !!errorMessage;

  return (
    <View className={`w-full ${className}`}>
      {label ? (
        <Body size="small" tone="soft" className="mb-1.5">
          {label}
        </Body>
      ) : null}
      <TextInput
        accessibilityLabel={label ?? rest.accessibilityLabel}
        placeholderTextColor={colors.inkMute}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          minHeight,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: hasError
            ? colors.danger
            : focused
              ? colors.sage
              : colors.creamDark,
          color: colors.ink,
          fontSize: 16 * scale,
          fontFamily: 'Inter_400Regular',
        }}
        {...rest}
      />
      {hint && !hasError ? (
        <Caption tone="mute" className="mt-1">
          {hint}
        </Caption>
      ) : null}
      {hasError ? (
        <Caption tone="danger" className="mt-1">
          {errorMessage}
        </Caption>
      ) : null}
    </View>
  );
}
