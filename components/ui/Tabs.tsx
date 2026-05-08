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
            style={{
              flex: 1,
              minHeight: minHeight - 12,
              borderRadius: 8,
              backgroundColor: active ? colors.white : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}
          >
            <Body
              size="small"
              tone={active ? 'default' : 'soft'}
              style={{ fontWeight: active ? '600' : '500' }}
            >
              {item.label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}
