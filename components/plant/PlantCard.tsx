import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Body, Caption } from '@/components/ui/Text';
import { computeWateringStatus } from '@/lib/wateringStatus';
import { colors, shadow } from '@/lib/theme';
import type { SavedPlant } from '@/types/plant';

type Props = {
  plant: SavedPlant;
};

/**
 * Card que aparece no Meu Jardim. Foto + apelido + espécie + status
 * de rega. Toque vai pra tela de detalhe.
 */
export function PlantCard({ plant }: Props) {
  const status = computeWateringStatus(plant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${plant.nickname}, ${status.label}`}
      onPress={() => router.push(`/plant/${plant.id}`)}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.creamDark,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
        ...shadow.card,
      })}
    >
      <View style={{ aspectRatio: 1, backgroundColor: colors.creamDark }}>
        <Image
          source={{ uri: plant.photoUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <Body
          numberOfLines={1}
          style={{ fontWeight: '600' }}
        >
          {plant.nickname}
        </Body>
        <Caption tone="mute" numberOfLines={1} style={{ fontStyle: 'italic' }}>
          {plant.identification.scientificName}
        </Caption>
        <View style={{ marginTop: 4 }}>
          <Badge label={status.label} variant={statusVariant(status.tone)} />
        </View>
      </View>
    </Pressable>
  );
}

function statusVariant(
  tone: 'success' | 'warning' | 'danger' | 'neutral',
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  return tone;
}
