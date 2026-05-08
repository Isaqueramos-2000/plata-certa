import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AskPanel } from '@/components/plant/AskPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import { askAboutPlant } from '@/services/plantChat';
import { useIdentificationStore } from '@/stores/identificationStore';
import type { IdentifySource } from '@/services/plantAI';
import type { ChatMessage, CommonProblem, Confidence, PlantIdentification } from '@/types/plant';

type Tab = 'care' | 'calendar' | 'curiosities' | 'problems';

const TAB_ITEMS: TabItem<Tab>[] = [
  { key: 'care', label: 'Cuidados' },
  { key: 'calendar', label: 'Calendário' },
  { key: 'curiosities', label: 'Curiosidades' },
  { key: 'problems', label: 'Problemas' },
];

const WEB_MAX_WIDTH = 480;

export default function ResultScreen() {
  const current = useIdentificationStore((s) => s.current);
  const [activeTab, setActiveTab] = useState<Tab>('care');
  // Histórico de Q&A em memória até o usuário salvar a planta. Quando
  // a Fase 5 entrar com o gardenStore, plantas salvas vão persistir
  // o próprio histórico e este state vira fallback pra plantas não
  // salvas.
  const [chat, setChat] = useState<ChatMessage[]>([]);

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
              <Tabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} />
            </View>

            <View style={{ marginTop: 16 }}>
              {activeTab === 'care' ? (
                <CareTab identification={identification} />
              ) : activeTab === 'calendar' ? (
                <CalendarTab identification={identification} />
              ) : activeTab === 'curiosities' ? (
                <CuriositiesTab identification={identification} />
              ) : (
                <ProblemsTab problems={identification.commonProblems} />
              )}
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
                history={chat}
                onAsk={(q, h) => askAboutPlant(identification, q, h)}
                onExchange={(q, a) => setChat((prev) => [...prev, q, a])}
                subtitle={`Pergunte qualquer coisa sobre ${identification.commonName}. Respostas curtas, direto ao ponto.`}
              />
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

function CareTab({ identification }: { identification: PlantIdentification }) {
  const { care } = identification;
  return (
    <Card>
      <InfoRow icon="sun.max.fill" label="Luz" value={care.light} />
      <Divider />
      <InfoRow icon="drop.fill" label="Rega" value={care.water} />
      <Divider />
      <InfoRow label="Solo" value={care.soil} />
      <Divider />
      <InfoRow label="Temperatura" value={care.temperature} />
      <Divider />
      <InfoRow label="Umidade" value={care.humidity} />
      <Divider />
      <InfoRow label="Adubação" value={care.fertilizer} />
    </Card>
  );
}

function CalendarTab({ identification }: { identification: PlantIdentification }) {
  const { calendar } = identification;
  return (
    <Card>
      <InfoRow label="Poda" value={calendar.pruning} />
      <Divider />
      <InfoRow label="Replantio" value={calendar.repotting} />
      <Divider />
      <InfoRow label="Adubação" value={calendar.fertilizing} />
    </Card>
  );
}

function CuriositiesTab({ identification }: { identification: PlantIdentification }) {
  return (
    <Card>
      {identification.funFacts.map((fact, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.sageLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Body size="small" tone="default" style={{ fontWeight: '600' }}>
                {i + 1}
              </Body>
            </View>
            <Body style={{ flex: 1 }}>{fact}</Body>
          </View>
          {i < identification.funFacts.length - 1 ? <Divider /> : null}
        </View>
      ))}
    </Card>
  );
}

function ProblemsTab({ problems }: { problems: CommonProblem[] }) {
  return (
    <View style={{ gap: 12 }}>
      {problems.map((p, i) => (
        <Card key={i}>
          <Heading level={3}>{p.problem}</Heading>
          <Caption tone="mute" className="mt-2 uppercase" style={{ letterSpacing: 1 }}>
            Sinais
          </Caption>
          <Body size="small" tone="soft" className="mt-1">
            {p.signs}
          </Body>
          <Caption tone="mute" className="mt-3 uppercase" style={{ letterSpacing: 1 }}>
            O que fazer
          </Caption>
          <Body size="small" className="mt-1">
            {p.solution}
          </Body>
        </Card>
      ))}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.creamDark,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <IconSymbol name={icon} size={16} color={colors.sageDark} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Caption tone="mute" style={{ letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Caption>
        <Body size="small" className="mt-0.5">
          {value}
        </Body>
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.creamDark,
        marginVertical: 12,
        marginHorizontal: -16,
      }}
    />
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

