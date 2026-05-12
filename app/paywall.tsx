import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import {
  DEMO_OFFERINGS,
  getOfferings,
  purchase,
  restorePurchases,
  type Offering,
  type PlanId,
} from '@/lib/purchases';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const PRIVACY_URL = 'https://plata-certa.vercel.app/privacy';

export default function PaywallScreen() {
  const [offerings, setOfferings] = useState<Offering[]>(DEMO_OFFERINGS);
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const markPro = useSubscriptionStore((s) => s.markPro);

  useEffect(() => {
    getOfferings()
      .then(setOfferings)
      .catch((err) => console.warn('[paywall] erro buscando ofertas:', err));
  }, []);

  const onSubscribe = async () => {
    setPurchasing(true);
    const result = await purchase(selected);
    setPurchasing(false);

    if (result.kind === 'success') {
      markPro(result.plan, computeExpiresAt(result.plan));
      router.replace('/(tabs)');
    } else if (result.kind === 'error') {
      Alert.alert('Não foi possível concluir', result.message);
    }
    // cancelled: silencioso
  };

  const onStartFree = () => {
    router.replace('/(tabs)');
  };

  const onRestore = async () => {
    const { hasPro } = await restorePurchases();
    if (hasPro) {
      markPro(selected, computeExpiresAt(selected));
      Alert.alert('Compra restaurada', 'Seu plano foi reativado.');
      router.replace('/(tabs)');
    } else {
      Alert.alert('Nada para restaurar', 'Não encontramos uma assinatura ativa nesta conta.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header />

      <View style={{ marginTop: 24, gap: 12 }}>
        <Heading level={1}>Identifique sem limites</Heading>
        <Body tone="soft">
          A IA do PlantaCerta reconhece qualquer planta e te entrega um guia completo de cuidados em português.
        </Body>
      </View>

      <View style={{ marginTop: 24, gap: 10 }}>
        <Benefit icon="leaf.fill" text="Identificação por foto com IA" />
        <Benefit icon="drop.fill" text="Lembretes de rega personalizados" />
        <Benefit icon="sun.max.fill" text="Guia de luz, solo, adubação e mais" />
        <Benefit icon="book.fill" text="Histórico de cuidados de cada planta" />
      </View>

      <View style={{ marginTop: 24, gap: 12 }}>
        <Caption tone="mute" style={{ letterSpacing: 1 }}>
          ESCOLHA SEU PLANO
        </Caption>
        {offerings.map((o) => (
          <PlanCard
            key={o.identifier}
            offering={o}
            selected={selected === o.identifier}
            onSelect={() => setSelected(o.identifier)}
          />
        ))}
      </View>

      <View style={{ marginTop: 24, gap: 12 }}>
        {purchasing ? (
          <View style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.sage} />
          </View>
        ) : (
          <Button label="Assinar agora" onPress={onSubscribe} fullWidth size="lg" />
        )}
        <Button
          label="Começar com 3 grátis"
          variant="ghost"
          onPress={onStartFree}
          fullWidth
        />
      </View>

      <View style={{ marginTop: 24, alignItems: 'center', gap: 12 }}>
        <Caption tone="mute" style={{ textAlign: 'center', maxWidth: 320 }}>
          A assinatura renova automaticamente. Você pode cancelar a qualquer momento nas configurações da Play Store.
        </Caption>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pressable onPress={onRestore}><Caption tone="default">Restaurar compra</Caption></Pressable>
          <Caption tone="mute">·</Caption>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Caption tone="default">Privacidade</Caption>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function Header() {
  return (
    <View style={{ alignItems: 'center', marginTop: 8, gap: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol name="leaf.fill" size={32} color={colors.cream} />
      </View>
      <Caption tone="mute" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
        PlantaCerta Pro
      </Caption>
    </View>
  );
}

function Benefit({
  icon,
  text,
}: {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  text: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.sageLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol name={icon} size={18} color={colors.sageDark} />
      </View>
      <Body style={{ flex: 1 }}>{text}</Body>
    </View>
  );
}

function PlanCard({
  offering,
  selected,
  onSelect,
}: {
  offering: Offering;
  selected: boolean;
  onSelect: () => void;
}) {
  const isBest = offering.highlight === 'best';

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${offering.title} ${offering.priceString}`}
      style={({ pressed }) => ({
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? colors.sage : colors.creamDark,
        backgroundColor: pressed ? colors.creamDark : colors.white,
        padding: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {isBest ? (
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: 16,
            backgroundColor: colors.terracotta,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Caption tone="inverse" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
            MELHOR ESCOLHA · 58% OFF
          </Caption>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Radio selected={selected} />
        <View style={{ flex: 1 }}>
          <Heading level={3}>{offering.title}</Heading>
          <Caption tone="mute" style={{ marginTop: 2 }}>
            {offering.description}
          </Caption>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Body style={{ fontWeight: '700', fontSize: 18 }}>{offering.priceString}</Body>
          {offering.pricePerMonthString ? (
            <Caption tone="mute">{offering.pricePerMonthString}</Caption>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? colors.sage : colors.inkMute,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      {selected ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.sage,
          }}
        />
      ) : null}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeExpiresAt(plan: PlanId): string {
  const d = new Date();
  if (plan === 'weekly') d.setDate(d.getDate() + 7);
  else if (plan === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
