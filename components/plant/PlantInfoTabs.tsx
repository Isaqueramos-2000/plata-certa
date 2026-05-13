import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import type { CommonProblem, PlantIdentification } from '@/types/plant';

/**
 * Abas de informação detalhada da planta — Cuidados, Calendário,
 * Curiosidades, Problemas. Usado tanto na tela de resultado (depois
 * da identificação) quanto no detalhe de planta salva (Meu Jardim).
 *
 * O estado da aba ativa fica local ao componente — cada tela tem
 * sua própria seleção.
 */

type Tab = 'care' | 'calendar' | 'curiosities' | 'problems';

const TAB_ITEMS: TabItem<Tab>[] = [
  { key: 'care', label: 'Cuidados' },
  { key: 'calendar', label: 'Calendário' },
  { key: 'curiosities', label: 'Curiosidades' },
  { key: 'problems', label: 'Problemas' },
];

type Props = {
  identification: PlantIdentification;
  initialTab?: Tab;
};

export function PlantInfoTabs({ identification, initialTab = 'care' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <View>
      <Tabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} />

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
    </View>
  );
}

// ─── Tab contents ────────────────────────────────────────────────────────────

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
  if (identification.funFacts.length === 0) {
    return (
      <Card>
        <Body tone="soft">Sem curiosidades cadastradas para esta planta ainda.</Body>
      </Card>
    );
  }
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
  if (problems.length === 0) {
    return (
      <Card>
        <Body tone="soft">Sem problemas comuns conhecidos para esta planta.</Body>
      </Card>
    );
  }
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
