import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Body } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

type Props = {
  messages: readonly string[];
  /** Tempo em ms entre trocas. Padrão: 1500. */
  intervalMs?: number;
};

/**
 * Loading animado com frases que se alternam — usado durante a
 * "análise" da planta pra dar uma sensação calma de progresso.
 */
export function LoadingMessages({ messages, intervalMs = 1500 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <ActivityIndicator size="large" color={colors.sage} />
      <Body tone="soft" style={{ textAlign: 'center' }}>
        {messages[index]}
      </Body>
    </View>
  );
}
