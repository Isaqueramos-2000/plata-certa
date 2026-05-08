import { router } from 'expo-router';
import { View } from 'react-native';

import { PlantCard } from '@/components/plant/PlantCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { t, type TranslationKey } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { useGardenStore } from '@/stores/gardenStore';

function greetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'home.greeting.morning';
  if (hour >= 12 && hour < 18) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

export default function HomeScreen() {
  const plants = useGardenStore((s) => s.plants);

  return (
    <Screen scroll>
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Caption tone="mute">{t(greetingKey())}</Caption>
        <Heading level={1}>{t('tabs.home')}</Heading>
      </View>

      <IdentifyCTA />

      {plants.length === 0 ? (
        <EmptyGardenState />
      ) : (
        <GardenGrid />
      )}
    </Screen>
  );
}

function IdentifyCTA() {
  return (
    <Card
      onPress={() => router.push('/(tabs)/identify')}
      accessibilityLabel={t('home.identifyCta')}
      emphasis="strong"
      style={{
        backgroundColor: colors.sage,
        borderColor: colors.sageDark,
        marginTop: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.sageDark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="camera.fill" size={28} color={colors.cream} />
        </View>
        <View style={{ flex: 1 }}>
          <Heading level={3} tone="inverse">
            {t('home.identifyCta')}
          </Heading>
          <Body size="small" tone="inverse" className="mt-1">
            Tire uma foto e receba o guia completo de cuidados.
          </Body>
        </View>
      </View>
    </Card>
  );
}

function GardenGrid() {
  const plants = useGardenStore((s) => s.plants);
  return (
    <View style={{ marginTop: 24 }}>
      <Caption tone="mute" style={{ letterSpacing: 1 }}>
        SUAS PLANTAS
      </Caption>
      <View
        style={{
          marginTop: 12,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -6,
        }}
      >
        {plants.map((plant) => (
          <View key={plant.id} style={{ width: '50%', padding: 6 }}>
            <PlantCard plant={plant} />
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyGardenState() {
  return (
    <View style={{ marginTop: 32, alignItems: 'center', paddingVertical: 32 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.creamDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <IconSymbol name="leaf.fill" size={48} color={colors.sage} />
      </View>
      <Heading level={3} className="text-center">
        {t('home.empty.title')}
      </Heading>
      <Body tone="soft" className="mt-2 text-center" style={{ maxWidth: 320 }}>
        {t('home.empty.subtitle')}
      </Body>
      <View style={{ marginTop: 24 }}>
        <Button
          label="Identificar primeira planta"
          variant="secondary"
          iconLeft="camera.fill"
          onPress={() => router.push('/(tabs)/identify')}
        />
      </View>
    </View>
  );
}
