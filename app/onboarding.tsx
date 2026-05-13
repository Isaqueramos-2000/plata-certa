import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import {
  useSettingsStore,
  type DisplayMode,
  type GardenerLevel,
} from '@/stores/settingsStore';

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const [step, setStep] = useState<Step>(1);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);
  const setMode = useSettingsStore((s) => s.setMode);
  const setGardenerLevel = useSettingsStore((s) => s.setGardenerLevel);

  const next = () => setStep((s) => (Math.min(s + 1, 3) as Step));

  const finish = (mode: DisplayMode) => {
    setMode(mode);
    setHasOnboarded(true);
    // Mostra o paywall logo após o onboarding. O usuário pode pular com
    // "Começar com 3 grátis" e entrar diretamente no app.
    router.replace('/paywall');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ProgressDots current={step} total={3} />

      {step === 1 ? (
        <WelcomeStep onContinue={next} />
      ) : step === 2 ? (
        <ExperienceStep
          onContinue={(level) => {
            setGardenerLevel(level);
            next();
          }}
        />
      ) : (
        <ModeStep onFinish={finish} />
      )}
    </Screen>
  );
}

function ProgressDots({ current, total }: { current: Step; total: number }) {
  return (
    <View
      accessibilityLabel={`Etapa ${current} de ${total}`}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 16,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i + 1 === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i + 1 === current ? colors.sage : colors.creamDark,
          }}
        />
      ))}
    </View>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={{ flex: 1, paddingVertical: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: colors.sageLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <IconSymbol name="leaf.fill" size={80} color={colors.sageDark} />
        </View>
        <Heading level={1} className="text-center">
          Bem-vindo à PlantaCerta
        </Heading>
        <Body size="large" tone="soft" className="mt-3 text-center">
          Identifique suas plantas e aprenda a cuidar delas com tranquilidade.
        </Body>
      </View>
      {/* Botão sempre no rodapé visível, independente da altura da tela */}
      <View style={{ marginTop: 16, paddingBottom: 8 }}>
        <Button label="Começar" onPress={onContinue} fullWidth size="lg" />
      </View>
    </View>
  );
}

function ExperienceStep({
  onContinue,
}: {
  onContinue: (level: GardenerLevel) => void;
}) {
  const [selected, setSelected] = useState<GardenerLevel | null>(null);

  const options: { key: GardenerLevel; title: string; subtitle: string }[] = [
    {
      key: 'beginner',
      title: 'É a minha primeira vez',
      subtitle: 'Quero começar com calma e dicas básicas',
    },
    {
      key: 'casual',
      title: 'Já tenho algumas plantas',
      subtitle: 'Cuido sem ser especialista',
    },
    {
      key: 'experienced',
      title: 'Sou experiente',
      subtitle: 'Quero o conteúdo direto, sem rodeios',
    },
  ];

  return (
    <View style={{ flex: 1, paddingVertical: 24 }}>
      <View style={{ flex: 1 }}>
        <Heading level={2}>Você já cuida de plantas?</Heading>
        <Body tone="soft" className="mt-2">
          Vamos personalizar as dicas iniciais para o seu nível.
        </Body>
        <View style={{ marginTop: 24, gap: 12 }}>
          {options.map((option) => {
            const active = selected === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.title}
                onPress={() => setSelected(option.key)}
                style={{
                  backgroundColor: active ? '#E1ECDF' : colors.white,
                  borderColor: active ? colors.sage : colors.creamDark,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <Body className="font-sans-semibold" style={{ fontWeight: '600' }}>
                  {option.title}
                </Body>
                <Caption tone="soft" className="mt-1">
                  {option.subtitle}
                </Caption>
              </Pressable>
            );
          })}
        </View>
      </View>
      {/* Botão sempre no rodapé visível, independente da altura da tela */}
      <View style={{ marginTop: 16, paddingBottom: 8 }}>
        <Button
          label="Continuar"
          fullWidth
          size="lg"
          disabled={!selected}
          onPress={() => selected && onContinue(selected)}
        />
      </View>
    </View>
  );
}

function ModeStep({ onFinish }: { onFinish: (mode: DisplayMode) => void }) {
  const [preview, setPreview] = useState<DisplayMode>('standard');

  return (
    <View style={{ flex: 1, paddingVertical: 24 }}>
      <View style={{ flex: 1 }}>
        <Heading level={2}>Como você prefere ler?</Heading>
        <Body tone="soft" className="mt-2">
          Você pode mudar isso a qualquer momento no perfil.
        </Body>

        <View style={{ marginTop: 24, gap: 12 }}>
          <ModeCard
            mode="standard"
            active={preview === 'standard'}
            onPress={() => setPreview('standard')}
            title="Padrão"
            description="Tamanho de fonte e contraste padrão"
          />
          <ModeCard
            mode="accessible"
            active={preview === 'accessible'}
            onPress={() => setPreview('accessible')}
            title="Acessível"
            description="Letras maiores, mais contraste e botões maiores"
          />
        </View>

        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.creamDark,
          }}
        >
          <Caption tone="mute">Pré-visualização</Caption>
          {/* Aplicamos as escalas direto aqui sem trocar o estado global,
              para o usuário ver o efeito antes de confirmar. */}
          <PreviewSample mode={preview} />
        </View>
      </View>

      {/* Botão sempre no rodapé visível, independente da altura da tela */}
      <View style={{ marginTop: 16, paddingBottom: 8 }}>
        <Button
          label={preview === 'accessible' ? 'Usar modo acessível' : 'Usar modo padrão'}
          fullWidth
          size="lg"
          onPress={() => onFinish(preview)}
        />
      </View>
    </View>
  );
}

function ModeCard({
  active,
  onPress,
  title,
  description,
}: {
  mode: DisplayMode;
  active: boolean;
  onPress: () => void;
  title: string;
  description: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        backgroundColor: active ? '#E1ECDF' : colors.white,
        borderColor: active ? colors.sage : colors.creamDark,
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: active ? colors.sage : colors.inkMute,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {active ? (
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
      <View style={{ flex: 1 }}>
        <Body className="font-sans-semibold" style={{ fontWeight: '600' }}>
          {title}
        </Body>
        <Caption tone="soft" className="mt-1">
          {description}
        </Caption>
      </View>
    </Pressable>
  );
}

/**
 * Render local que ignora o store global e usa as escalas do modo
 * pré-selecionado. Mantém o preview puramente visual antes do commit.
 */
function PreviewSample({ mode }: { mode: DisplayMode }) {
  const scale = mode === 'accessible' ? 1.3 : 1;
  const heading = 20 * scale;
  const body = 16 * scale;
  const headingColor = mode === 'accessible' ? '#000' : colors.ink;
  const bodyColor = mode === 'accessible' ? colors.ink : colors.inkSoft;
  return (
    <View style={{ marginTop: 8 }}>
      <Body
        className="font-display"
        style={{ fontSize: heading, color: headingColor, lineHeight: heading * 1.2 }}
      >
        Costela-de-adão
      </Body>
      <Body
        className="font-sans"
        style={{
          fontSize: body,
          color: bodyColor,
          lineHeight: body * 1.5,
          marginTop: 4,
        }}
      >
        Gosta de luz indireta e regas a cada cinco dias.
      </Body>
    </View>
  );
}
