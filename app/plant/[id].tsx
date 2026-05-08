import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmDestructive } from '@/lib/confirm';

import { AskPanel } from '@/components/plant/AskPanel';
import { askAboutPlant } from '@/services/plantChat';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import { computeWateringStatus, formatDateShort, relativeTime } from '@/lib/wateringStatus';
import { useGardenStore, useSavedPlant } from '@/stores/gardenStore';
import type { CareAction, CareLogEntry, SavedPlant } from '@/types/plant';

const WEB_MAX_WIDTH = 480;

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = useSavedPlant(id);
  const logCare = useGardenStore((s) => s.logCare);
  const removePlant = useGardenStore((s) => s.removePlant);
  const addPhoto = useGardenStore((s) => s.addPhoto);
  const addChatExchange = useGardenStore((s) => s.addChatExchange);

  if (!plant) return <NotFound />;

  const status = computeWateringStatus(plant);

  const onAction = (action: CareAction) => {
    if (action === 'photo') return; // tratado em onAddPhoto
    logCare(plant.id, action);
  };

  const onAddPhoto = async () => {
    if (!isWeb) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Para tirar fotos, libere o acesso à câmera.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Tente outra foto', 'Não foi possível ler essa imagem.');
        return;
      }
      const mime = (asset.mimeType ?? 'image/jpeg').includes('png')
        ? 'image/png'
        : 'image/jpeg';
      // Mesmo motivo de identify.tsx: data URL persiste, blob: não.
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      addPhoto(plant.id, dataUrl);
    }
  };

  const onRemove = async () => {
    const ok = await confirmDestructive(
      'Remover planta',
      `Tem certeza que quer remover "${plant.nickname}" do seu jardim? O histórico será perdido.`,
    );
    if (ok) {
      removePlant(plant.id);
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <View
        style={{
          flex: 1,
          width: '100%',
          ...(isWeb
            ? {
                maxWidth: WEB_MAX_WIDTH,
                marginLeft: 'auto' as const,
                marginRight: 'auto' as const,
              }
            : null),
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Hero plant={plant} onClose={() => router.back()} onRemove={onRemove} />
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <Header plant={plant} />
            <WateringSection plant={plant} status={status} />

            <View style={{ marginTop: 24 }}>
              <Caption tone="mute" style={{ letterSpacing: 1 }}>
                AÇÕES RÁPIDAS
              </Caption>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <ActionTile
                  icon="drop.fill"
                  label="Reguei agora"
                  onPress={() => onAction('watered')}
                />
                <ActionTile
                  icon="leaf.fill"
                  label="Adubei"
                  onPress={() => onAction('fertilized')}
                />
                <ActionTile
                  icon="leaf.fill"
                  label="Podei"
                  onPress={() => onAction('pruned')}
                />
                <ActionTile icon="camera.fill" label="Foto" onPress={onAddPhoto} />
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <Caption tone="mute" style={{ letterSpacing: 1 }}>
                HISTÓRICO
              </Caption>
              <Timeline entries={plant.careLog} />
            </View>

            <View
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: colors.creamDark,
              }}
            >
              <AskPanel
                history={plant.chatHistory}
                onAsk={(q, h) => askAboutPlant(plant.identification, q, h)}
                onExchange={(q, a) => addChatExchange(plant.id, q, a)}
                subtitle={`Pergunte qualquer coisa sobre ${plant.nickname}. Respostas curtas, direto ao ponto.`}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function NotFound() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}
      >
        <IconSymbol name="leaf.fill" size={64} color={colors.sage} />
        <Heading level={2}>Planta não encontrada</Heading>
        <Body tone="soft" style={{ textAlign: 'center' }}>
          Pode ter sido removida ou ainda não foi salva.
        </Body>
        <View style={{ marginTop: 12 }}>
          <Button label="Voltar para o jardim" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Hero({
  plant,
  onClose,
  onRemove,
}: {
  plant: SavedPlant;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        aspectRatio: 1,
        backgroundColor: colors.creamDark,
        position: 'relative',
      }}
    >
      <Image
        source={{ uri: plant.photoUri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={200}
      />
      <View
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          backgroundColor: 'rgba(26, 31, 27, 0.45)',
          borderRadius: 999,
        }}
      >
        <Button label="Voltar" iconLeft="chevron.left" variant="ghost" onPress={onClose} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remover planta"
        onPress={onRemove}
        style={({ pressed }) => ({
          position: 'absolute',
          top: 12,
          right: 12,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pressed ? 'rgba(155, 59, 42, 0.85)' : 'rgba(26, 31, 27, 0.45)',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <IconSymbol name="trash.fill" size={20} color={colors.cream} />
      </Pressable>
    </View>
  );
}

function Header({ plant }: { plant: SavedPlant }) {
  return (
    <View>
      <Heading level={1}>{plant.nickname}</Heading>
      <Body
        size="large"
        tone="soft"
        style={{ fontStyle: 'italic', marginTop: 4 }}
      >
        {plant.identification.commonName} • {plant.identification.scientificName}
      </Body>
    </View>
  );
}

function WateringSection({
  plant,
  status,
}: {
  plant: SavedPlant;
  status: ReturnType<typeof computeWateringStatus>;
}) {
  return (
    <Card
      emphasis="strong"
      style={{
        marginTop: 16,
        backgroundColor:
          status.tone === 'danger'
            ? '#F4D7D1'
            : status.tone === 'warning'
              ? '#F6E1D2'
              : status.tone === 'success'
                ? '#E1ECDF'
                : colors.creamDark,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="drop.fill" size={20} color={colors.sageDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{status.label}</Body>
          <Caption tone="soft" style={{ marginTop: 2 }}>
            {plant.lastWateredAt
              ? `Última rega ${relativeTime(plant.lastWateredAt)}`
              : `Frequência: a cada ${plant.identification.care.waterFrequencyDays} dias`}
          </Caption>
        </View>
      </View>
    </Card>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: '48%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: pressed ? colors.creamDark : colors.white,
        borderWidth: 1,
        borderColor: colors.creamDark,
      })}
    >
      <IconSymbol name={icon} size={20} color={colors.sageDark} />
      <Body size="small" style={{ fontWeight: '500' }}>
        {label}
      </Body>
    </Pressable>
  );
}

function Timeline({ entries }: { entries: CareLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <View
        style={{
          marginTop: 8,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.creamDark,
        }}
      >
        <Body size="small" tone="soft">
          Os cuidados que você registrar vão aparecer aqui.
        </Body>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8, gap: 8 }}>
      {entries.slice(0, 12).map((entry) => (
        <TimelineItem key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

const ACTION_LABEL: Record<CareAction, string> = {
  watered: 'Regou',
  fertilized: 'Adubou',
  pruned: 'Podou',
  photo: 'Tirou foto',
  note: 'Anotou',
};

const ACTION_ICON: Record<CareAction, Parameters<typeof IconSymbol>[0]['name']> = {
  watered: 'drop.fill',
  fertilized: 'leaf.fill',
  pruned: 'leaf.fill',
  photo: 'camera.fill',
  note: 'book.fill',
};

function TimelineItem({ entry }: { entry: CareLogEntry }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.creamDark,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.creamDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol name={ACTION_ICON[entry.action]} size={16} color={colors.sageDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Body size="small" style={{ fontWeight: '500' }}>
          {ACTION_LABEL[entry.action]}
        </Body>
        <Caption tone="mute">{relativeTime(entry.at)}</Caption>
      </View>
      <Caption tone="mute" style={{ marginRight: 8 }}>
        {formatDateShort(entry.at)}
      </Caption>
      <Badge label={ACTION_LABEL[entry.action]} variant="neutral" />
    </Animated.View>
  );
}
