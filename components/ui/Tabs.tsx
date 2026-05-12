import { Pressable, View } from 'react-native';

import { Body } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { useTouchTarget } from '@/stores/settingsStore';

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Segmented tabs estilo iOS — usadas dentro da tela de resultado
 * para alternar entre Cuidados / Calendário / Curiosidades.
 *
 * Para a navegação principal usamos expo-router Tabs no _layout.tsx;
 * este componente é só para abas dentro de uma única tela.
 */
export function Tabs<T extends string>({ items, value, onChange, className = '' }: Props<T>) {
  const minHeight = useTouchTarget();
  return (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.creamDark,
        borderRadius: 12,
        padding: 4,
        gap: 2,
      }}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: minHeight - 12,
              borderRadius: 8,
              backgroundColor: active ? colors.white : pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              // Sombra na aba ativa
              ...(active
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 3,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.06)',
                  }
                : {}),
            })}
          >
            <Body
              size="small"
              style={{
                fontWeight: active ? '700' : '400',
                color: active ? colors.sageDark : colors.inkMute,
                fontSize: 13,
              }}
            >
              {item.label}
            </Body>
            {/* Linha de destaque na base da aba ativa */}
            {active && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 5,
                  width: 16,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: colors.sage,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
