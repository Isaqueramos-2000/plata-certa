import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { LimitReachedSheet } from '@/components/plant/LimitReachedSheet';
import { LoadingMessages } from '@/components/plant/LoadingMessages';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { useCanIdentify } from '@/hooks/useCanIdentify';
import { resizeForUpload } from '@/lib/imageResize';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import {
  ANALYSIS_MESSAGES,
  identifyPlant,
  toIdentifyError,
} from '@/services/plantAI';
import { useIdentificationStore } from '@/stores/identificationStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

type Stage =
  | { kind: 'idle' }
  | { kind: 'preview'; uri: string; base64: string }
  | { kind: 'analyzing'; uri: string };

export default function IdentifyScreen() {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [limitSheet, setLimitSheet] = useState<'trial-exhausted' | 'monthly-exhausted' | null>(null);
  const setIdentification = useIdentificationStore((s) => s.set);
  const gate = useCanIdentify();
  const consumeOne = useSubscriptionStore((s) => s.consumeOne);

  const handleAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      // Resize pra 768x768 jpeg + converte pra data URL portátil. Resolve
      // dois problemas de uma vez:
      //   1. corta ~60% dos tokens de visão na chamada do Claude
      //   2. URLs `blob:` do web expiram com a sessão; data URL persiste
      //      no AsyncStorage/localStorage entre reloads.
      const resized = await resizeForUpload(asset.uri);
      setStage({ kind: 'preview', uri: resized.uri, base64: resized.base64 });
    } catch (err) {
      console.warn('[identify] resize falhou:', err);
      Alert.alert('Tente outra foto', 'Não foi possível processar essa imagem.');
    }
  };

  const pickFromCamera = async () => {
    if (!gate.canIdentify) {
      setLimitSheet(gate.reason === 'trial-exhausted' ? 'trial-exhausted' : 'monthly-exhausted');
      return;
    }
    if (!isWeb) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Para tirar fotos, libere o acesso à câmera.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9, // qualidade alta na captura; o resize cuida do tamanho final
    });
    if (!result.canceled && result.assets[0]) await handleAsset(result.assets[0]);
  };

  const pickFromGallery = async () => {
    if (!gate.canIdentify) {
      setLimitSheet(gate.reason === 'trial-exhausted' ? 'trial-exhausted' : 'monthly-exhausted');
      return;
    }
    if (!isWeb) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Para escolher fotos, libere o acesso à galeria.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) await handleAsset(result.assets[0]);
  };

  const analyze = async (uri: string, base64: string) => {
    if (!gate.canIdentify) {
      setLimitSheet(gate.reason === 'trial-exhausted' ? 'trial-exhausted' : 'monthly-exhausted');
      return;
    }
    setStage({ kind: 'analyzing', uri });
    try {
      const result = await identifyPlant(base64, 'image/jpeg');
      // Sucesso → consome 1 do trial/quota
      consumeOne();
      setIdentification({ uri, ...result });
      router.push('/result');
      // Volta o estado pra idle pra evitar reanalizar quando voltar
      setStage({ kind: 'idle' });
    } catch (err) {
      const error = toIdentifyError(err);
      // Logamos kind+message planos pra debug em devtools (objetos
      // ficam como [object Object] em alguns transports).
      console.warn(
        `[identify] análise falhou (${error.kind}):`,
        error.message,
        err,
      );
      Alert.alert(titleFor(error.kind), error.message);
      setStage({ kind: 'preview', uri, base64 });
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Heading level={1}>Identificar planta</Heading>
        <Body tone="soft" className="mt-2">
          Tire ou escolha uma foto. Centralize a planta e procure boa iluminação.
        </Body>
      </View>

      <QuotaBadge remaining={gate.remaining} total={gate.total} reason={gate.reason} />

      {stage.kind === 'idle' ? (
        <IdleState onCamera={pickFromCamera} onGallery={pickFromGallery} />
      ) : stage.kind === 'preview' ? (
        <PreviewState
          uri={stage.uri}
          onAnalyze={() => analyze(stage.uri, stage.base64)}
          onRetake={() => setStage({ kind: 'idle' })}
        />
      ) : (
        <AnalyzingState uri={stage.uri} />
      )}

      <LimitReachedSheet
        visible={limitSheet !== null}
        onClose={() => setLimitSheet(null)}
        reason={limitSheet ?? 'trial-exhausted'}
      />
    </Screen>
  );
}

function QuotaBadge({
  remaining,
  total,
  reason,
}: {
  remaining: number;
  total: number;
  reason: 'trial' | 'pro' | 'trial-exhausted' | 'monthly-exhausted';
}) {
  const isProActive = reason === 'pro';
  const isLowTrial = reason === 'trial' && remaining <= 1;
  return (
    <View
      style={{
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: isLowTrial ? '#F5E1D4' : colors.sageLight,
        alignSelf: 'flex-start',
      }}
    >
      <IconSymbol
        name={isProActive ? 'star.fill' : 'leaf.fill'}
        size={14}
        color={colors.sageDark}
      />
      <Body size="small" style={{ fontWeight: '600' }}>
        {isProActive
          ? `${remaining} de ${total} este mês`
          : `${remaining} de ${total} identificações grátis`}
      </Body>
    </View>
  );
}

function titleFor(kind: ReturnType<typeof toIdentifyError>['kind']): string {
  switch (kind) {
    case 'no-api-key':
      return 'API não configurada';
    case 'network':
      return 'Sem conexão';
    case 'rate-limited':
      return 'Aguarde um pouco';
    case 'malformed':
      return 'Tente outra foto';
    default:
      return 'Tente novamente';
  }
}

function IdleState({
  onCamera,
  onGallery,
}: {
  onCamera: () => void;
  onGallery: () => void;
}) {
  return (
    <View style={{ marginTop: 24, gap: 16 }}>
      <ActionCard
        iconName="camera.fill"
        title="Tirar foto"
        subtitle="Use a câmera do dispositivo"
        onPress={onCamera}
      />
      <ActionCard
        iconName="leaf.fill"
        title="Escolher da galeria"
        subtitle="Selecione uma foto que você já tem"
        onPress={onGallery}
      />
      <View
        style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: colors.creamDark,
          borderRadius: 16,
        }}
      >
        <Body size="small" tone="soft">
          Dica: fotos com fundo neutro e folhas em foco rendem identificações melhores.
        </Body>
      </View>
    </View>
  );
}

function ActionCard({
  iconName,
  title,
  subtitle,
  onPress,
}: {
  iconName: Parameters<typeof IconSymbol>[0]['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={title}
      emphasis="strong"
      style={{ paddingVertical: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.sageLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name={iconName} size={28} color={colors.sageDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Heading level={3}>{title}</Heading>
          <Caption tone="soft" className="mt-1">
            {subtitle}
          </Caption>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.inkMute} />
      </View>
    </Card>
  );
}

function PreviewState({
  uri,
  onAnalyze,
  onRetake,
}: {
  uri: string;
  onAnalyze: () => void;
  onRetake: () => void;
}) {
  return (
    <View style={{ marginTop: 16, gap: 16 }}>
      <View
        style={{
          aspectRatio: 1,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.creamDark,
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <Button label="Analisar" iconLeft="leaf.fill" fullWidth size="lg" onPress={onAnalyze} />
      <Button label="Tirar outra" variant="ghost" fullWidth onPress={onRetake} />
    </View>
  );
}

function AnalyzingState({ uri }: { uri: string }) {
  return (
    <View style={{ marginTop: 16, gap: 24, alignItems: 'center' }}>
      <View
        style={{
          aspectRatio: 1,
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.creamDark,
          opacity: 0.6,
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <View style={{ paddingVertical: 24 }}>
        <LoadingMessages messages={ANALYSIS_MESSAGES} />
      </View>
    </View>
  );
}
