import { router } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore, TRIAL_MAX, MONTHLY_MAX } from '@/stores/subscriptionStore';

export default function ProfileScreen() {
  const { mode, notificationsEnabled, setMode, setNotificationsEnabled, resetOnboarding } =
    useSettingsStore();

  return (
    <Screen scroll>
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Heading level={1}>{t('profile.title')}</Heading>
      </View>

      <Section title="Sua Assinatura">
        <SubscriptionCard />
      </Section>

      <Section title={t('profile.displayMode')}>
        <Card>
          <ModeChoice
            label={t('profile.displayMode.standard')}
            description="Tamanho de fonte e contraste padrão"
            active={mode === 'standard'}
            onPress={() => setMode('standard')}
          />
          <Divider />
          <ModeChoice
            label={t('profile.displayMode.accessible')}
            description="Letras 30% maiores e contraste reforçado"
            active={mode === 'accessible'}
            onPress={() => setMode('accessible')}
          />
        </Card>
      </Section>

      <Section title="Preferências">
        <Card>
          <Row
            iconName="drop.fill"
            label={t('profile.notifications')}
            hint="Lembretes de rega e cuidados"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ true: colors.sage, false: colors.creamDark }}
                thumbColor={colors.white}
                accessibilityLabel={t('profile.notifications')}
              />
            }
          />
          <Divider />
          <Row
            iconName="sun.max.fill"
            label={t('profile.location')}
            hint="Em breve: dicas adaptadas ao clima"
            disabled
          />
          <Divider />
          <Row
            iconName="book.fill"
            label={t('profile.language')}
            hint="Português (Brasil)"
            disabled
          />
        </Card>
      </Section>

      <Section title="Sobre">
        <Card>
          <Row label={t('profile.about')} disabled />
          <Divider />
          <Row label={t('profile.privacy')} disabled />
        </Card>
      </Section>

      {__DEV__ ? (
        <Section title="Desenvolvimento">
          <Card>
            <Row
              label="Refazer onboarding"
              hint="Apaga o estado e volta para a tela de boas-vindas"
              onPress={() => {
                resetOnboarding();
                router.replace('/onboarding');
              }}
            />
            <Divider />
            <Row
              label="Resetar assinatura"
              hint="Volta para o trial (3 grátis)"
              onPress={() => useSubscriptionStore.getState().resetAll()}
            />
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

function SubscriptionCard() {
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const plan = useSubscriptionStore((s) => s.plan);
  const trialUsed = useSubscriptionStore((s) => s.trialUsed);
  const monthlyUsed = useSubscriptionStore((s) => s.monthlyUsed);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);

  const isPro = entitlement === 'pro';
  const remaining = isPro ? MONTHLY_MAX - monthlyUsed : TRIAL_MAX - trialUsed;
  const planLabel =
    plan === 'weekly' ? 'Semanal' : plan === 'monthly' ? 'Mensal' : plan === 'yearly' ? 'Anual' : '';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isPro ? colors.sage : colors.creamDark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol
            name={isPro ? 'crown.fill' : 'leaf.fill'}
            size={22}
            color={isPro ? colors.cream : colors.sageDark}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '700' }}>
            {isPro ? `PlantaCerta Pro · ${planLabel}` : 'Plano gratuito'}
          </Body>
          <Caption tone="mute" className="mt-0.5">
            {isPro
              ? `${remaining} de ${MONTHLY_MAX} identificações este mês` +
                (expiresAt ? ` · Renova ${formatDate(expiresAt)}` : '')
              : `${remaining} de ${TRIAL_MAX} identificações grátis`}
          </Caption>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Pressable
          onPress={() => router.push('/paywall')}
          accessibilityRole="button"
          accessibilityLabel={isPro ? 'Gerenciar plano' : 'Ver planos'}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: pressed ? colors.creamDark : 'transparent',
            borderWidth: 1,
            borderColor: colors.sage,
            alignSelf: 'flex-start',
          })}
        >
          <Caption style={{ color: colors.sageDark, fontWeight: '600' }}>
            {isPro ? 'Gerenciar plano' : 'Ver planos'}
          </Caption>
        </Pressable>
      </View>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Caption tone="mute" className="mb-2 uppercase" style={{ letterSpacing: 1 }}>
        {title}
      </Caption>
      {children}
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

function Row({
  label,
  hint,
  iconName,
  right,
  onPress,
  disabled,
}: {
  label: string;
  hint?: string;
  iconName?: Parameters<typeof IconSymbol>[0]['name'];
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {iconName ? (
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
          <IconSymbol name={iconName} size={18} color={colors.sageDark} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Body className="font-sans-medium" style={{ fontWeight: '500' }}>
          {label}
        </Body>
        {hint ? (
          <Caption tone="mute" className="mt-0.5">
            {hint}
          </Caption>
        ) : null}
      </View>
      {right}
      {onPress && !disabled && !right ? (
        <IconSymbol name="chevron.right" size={18} color={colors.inkMute} />
      ) : null}
    </Container>
  );
}

function ModeChoice({
  label,
  description,
  active,
  onPress,
}: {
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
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
        <Body className="font-sans-medium" style={{ fontWeight: '500' }}>
          {label}
        </Body>
        <Caption tone="mute" className="mt-0.5">
          {description}
        </Caption>
      </View>
    </Pressable>
  );
}
