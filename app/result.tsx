import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlantInfoTabs } from '@/components/plant/PlantInfoTabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import { useIdentificationStore } from '@/stores/identificationStore';
import type { IdentifySource } from '@/services/plantAI';
import type { Confidence, PlantIdentification } from '@/types/plant';

const WEB_MAX_WIDTH = 480;

export default function ResultScreen() {
  const current = useIdentificationStore((s) => s.current);

  // Sem identificação no store (refresh ou deep link). Mostramos um
  // fallback amigável com CTA pra voltar.
  if (!current) {
    return <EmptyState />;
  }

  const { uri, identification, source } = current;

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
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Hero uri={uri} onClose={() => router.back()} />
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <Header identification={identification} source={source} />
            <ConfidenceNotice confidence={identification.confidence} />
            <Body tone="soft" style={{ marginTop: 16 }}>
              {identification.description}
            </Body>

            <View style={{ marginTop: 24 }}>
              <PlantInfoTabs identification={identification} />
            </View>

          </View>
        </ScrollView>
        <Footer onAdd={() => router.push('/add-to-garden')} />
      </View>
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <IconSymbol name="leaf.fill" size={64} color={colors.sage} />
        <Heading level={2} className="text-center">
          Nada para mostrar aqui
        </Heading>
        <Body tone="soft" style={{ textAlign: 'center', maxWidth: 320 }}>
          Tire uma foto na aba Identificar para gerar um guia.
        </Body>
        <Button
          label="Identificar planta"
          iconLeft="camera.fill"
          onPress={() => router.replace('/(tabs)/identify')}
        />
      </View>
    </SafeAreaView>
  );
}

function Hero({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <View
      style={{
        aspectRatio: 1,
        backgroundColor: colors.creamDark,
        position: 'relative',
      }}
    >
      <Image
        source={{ uri }}
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
    </View>
  );
}

function Header({
  identification,
  source,
}: {
  identification: PlantIdentification;
  source: IdentifySource;
}) {
  return (
    <View>
      <Heading level={1}>{identification.commonName}</Heading>
      <Body
        size="large"
        tone="soft"
        style={{ fontStyle: 'italic', marginTop: 4 }}
      >
        {identification.scientificName}
      </Body>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 12,
        }}
      >
        <ConfidenceBadge confidence={identification.confidence} />
        <Badge label={`Família: ${identification.family}`} variant="neutral" />
        <Badge
          label={`Cuidado ${identification.difficulty}`}
          variant={
            identification.difficulty === 'fácil'
              ? 'success'
              : identification.difficulty === 'médio'
                ? 'warning'
                : 'danger'
          }
        />
        <SourceBadge source={source} />
      </View>
    </View>
  );
}

function SourceBadge({ source }: { source: IdentifySource }) {
  // Sinaliza ao usuário se o conteúdo veio do cache local, foi gerado
  // agora pela IA, ou é um exemplo (mock mode em desenvolvimento).
  if (source === 'cache') return <Badge label="Do nosso banco" variant="info" />;
  if (source === 'mock') return <Badge label="Modo demo" variant="neutral" />;
  return null;
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence === 'high') return <Badge label="Confiança alta" variant="success" />;
  if (confidence === 'medium') return <Badge label="Confiança média" variant="warning" />;
  return <Badge label="Confiança baixa" variant="danger" />;
}

function ConfidenceNotice({ confidence }: { confidence: Confidence }) {
  if (confidence !== 'low') return null;
  return (
    <View
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F4D7D1',
        borderWidth: 1,
        borderColor: colors.danger,
      }}
    >
      <Body size="small" style={{ color: colors.danger, fontWeight: '600' }}>
        Não tenho certeza dessa identificação.
      </Body>
      <Caption tone="soft" style={{ marginTop: 4 }}>
        Tente uma foto com a planta mais centralizada e melhor iluminação para um resultado mais preciso.
      </Caption>
    </View>
  );
}

function Footer({ onAdd }: { onAdd: () => void }) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.cream,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: colors.creamDark,
      }}
    >
      <Button
        label="Adicionar ao Meu Jardim"
        iconLeft="plus"
        fullWidth
        size="lg"
        onPress={onAdd}
      />
    </View>
  );
}

