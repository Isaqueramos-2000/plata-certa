import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import {
  useSettingsStore,
  type DisplayMode,
  type GardenerLevel,
} from '@/stores/settingsStore';

type Step = 1 | 2 | 3;

/**
 * Onboarding em 3 passos. Cada passo segue o mesmo padrão de layout:
 *
 *   ┌─────────────────────────────┐
 *   │ Header (ProgressDots)       │ ← fixo no topo
 *   ├─────────────────────────────┤
 *   │ ScrollView (conteúdo)       │ ← rola se passar da altura
 *   ├─────────────────────────────┤
 *   │ Footer (botão de ação)      │ ← STICKY, sempre visível
 *   └─────────────────────────────┘
 *
 * Esse padrão de "sticky footer" garante que o botão de avançar fique
 * sempre visível, independente do tamanho da tela e do comportamento do
 * Yoga (engine de layout do Android). É mais robusto que usar `flex: 1`
 * em vários níveis aninhados (que renderiza ok no web mas falha no Android).
 */
export default function Onboarding() {
  const [step, setStep] = useState<Step>(1);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);
  const setMode = useSettingsStore((s) => s.setMode);
  const setGardenerLevel = useSettingsStore((s) => s.setGardenerLevel);
  const insets = useSafeAreaInsets();

  const next = () => setStep((s) => (Math.min(s + 1, 3) as Step));

  const finish = (mode: DisplayMode) => {
    setMode(mode);
    setHasOnboarded(true);
    // Mostra o paywall logo após o onboarding. O usuário pode pular com
    // "Começar com 3 grátis" e entrar diretamente no app.
    router.replace('/paywall');
  };

  // Padding interno do rodapé (entre o botão e o limite da safe area).
  const FOOTER_INNER_PADDING = 16;

  return (
    // IMPORTANTE: aplicamos TANTO insets.top quanto insets.bottom no container
    // raiz. Sem o paddingBottom, o container extende atrás da gesture bar do
    // Android (edge-to-edge ativo), fazendo o rodapé absoluto com bottom:0
    // ficar parcialmente escondido. Com paddingBottom, o "fundo" do container
    // é o topo da gesture bar — exatamente onde queremos o botão.
    <View
      style={{
        flex: 1,
        backgroundColor: colors.cream,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ProgressDots current={step} total={3} />

      {step === 1 ? (
        <WelcomeStep onContinue={next} bottomGap={FOOTER_INNER_PADDING} />
      ) : step === 2 ? (
        <ExperienceStep
          bottomGap={FOOTER_INNER_PADDING}
          onContinue={(level) => {
            setGardenerLevel(level);
            next();
          }}
        />
      ) : (
        <ModeStep onFinish={finish} bottomGap={FOOTER_INNER_PADDING} />
      )}
    </View>
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

// ─── Layout shell para cada passo (ScrollView + sticky footer) ──────────────

function StepLayout({
  children,
  footer,
  bottomGap,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Padding extra para o safe-area do Android (gesture bar/nav buttons). */
  bottomGap: number;
}) {
  // Espaço reservado no final do scroll para o rodapé não cobrir o conteúdo.
  // Soma altura do botão (~56dp) + padding top (12) + padding bottom (bottomGap).
  const FOOTER_HEIGHT = 56 + 12 + bottomGap;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: FOOTER_HEIGHT + 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {/*
        Rodapé absoluto — ancorado ao fundo do container pai.
        Manualmente adicionamos o safe-area inset via `bottomGap` para
        funcionar de forma idêntica em todas as plataformas, sem depender
        do SafeAreaView (que tem comportamentos sutis no Android com
        edge-to-edge ativado).
      */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: bottomGap,
          // DEBUG temporário: fundo creme-escuro (visível mas suave)
          // pra confirmar que a área do rodapé está sendo renderizada
          // corretamente. Trocar pra colors.cream depois de validar.
          backgroundColor: colors.creamDark,
          borderTopWidth: 2,
          borderTopColor: colors.sage,
        }}
      >
        {footer}
      </View>
    </View>
  );
}

// ─── Passo 1: Boas-vindas ───────────────────────────────────────────────────

function WelcomeStep({
  onContinue,
  bottomGap,
}: {
  onContinue: () => void;
  bottomGap: number;
}) {
  return (
    <StepLayout
      bottomGap={bottomGap}
      footer={<Button label="Começar" onPress={onContinue} fullWidth size="lg" />}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 24,
        }}
      >
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
    </StepLayout>
  );
}

// ─── Passo 2: Nível de experiência ──────────────────────────────────────────

function ExperienceStep({
  onContinue,
  bottomGap,
}: {
  onContinue: (level: GardenerLevel) => void;
  bottomGap: number;
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
    <StepLayout
      bottomGap={bottomGap}
      footer={
        <Button
          label="Continuar"
          fullWidth
          size="lg"
          disabled={!selected}
          onPress={() => selected && onContinue(selected)}
        />
      }
    >
      <View style={{ paddingVertical: 16 }}>
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
    </StepLayout>
  );
}

// ─── Passo 3: Modo de leitura ───────────────────────────────────────────────

function ModeStep({
  onFinish,
  bottomGap,
}: {
  onFinish: (mode: DisplayMode) => void;
  bottomGap: number;
}) {
  const [preview, setPreview] = useState<DisplayMode>('standard');

  return (
    <StepLayout
      bottomGap={bottomGap}
      footer={
        <Button
          label={preview === 'accessible' ? 'Usar modo acessível' : 'Usar modo padrão'}
          fullWidth
          size="lg"
          onPress={() => onFinish(preview)}
        />
      }
    >
      <View style={{ paddingVertical: 16 }}>
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
    </StepLayout>
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
