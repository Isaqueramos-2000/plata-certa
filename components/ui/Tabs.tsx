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
 * para alternar entre Cuidados / Calendário / Curiosidades / Problemas.
 *
 * IMPLEMENTAÇÃO: usa style estático (objeto) em vez de `style={({pressed}) => …}`.
 * O callback do Pressable tem bug conhecido no Android + new arch onde
 * o backgroundColor não aplica no primeiro render, deixando o "tab ativo"
 * sem o fundo branco que o diferencia visualmente.
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
        gap: 4,
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
              paddingVertical: 6,
              paddingHorizontal: 6,
              // Sombra/borda na aba ativa pra destacar
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
            }}
          >
            <Body
              size="small"
              style={{
                fontWeight: active ? '700' : '500',
                color: active ? colors.sageDark : colors.inkMute,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {item.label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}
