import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/Input';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import { useGardenStore } from '@/stores/gardenStore';
import { useIdentificationStore } from '@/stores/identificationStore';

const WEB_MAX_WIDTH = 480;

export default function AddToGardenScreen() {
  const current = useIdentificationStore((s) => s.current);
  const addPlant = useGardenStore((s) => s.addPlant);
  const [nickname, setNickname] = useState(current?.identification.commonName ?? '');

  if (!current) {
    // Caso raro (entrar no modal sem ter identificado nada). Volta.
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Body tone="soft">Nenhuma identificação para salvar.</Body>
          <View style={{ marginTop: 16 }}>
            <Button label="Voltar" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const save = () => {
    const id = addPlant({
      identification: current.identification,
      photoUri: current.uri,
      nickname,
    });
    // Substitui o modal pela tela de detalhe.
    router.dismissAll?.();
    router.replace(`/plant/${id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top', 'bottom']}>
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
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.ink} />
          </Pressable>
          <Caption tone="mute">Salvar no jardim</Caption>
          <View style={{ width: 24 }} />
        </View>

        <Heading level={2}>Como você quer chamar?</Heading>
        <Body tone="soft" style={{ marginTop: 8 }}>
          Dê um apelido pra essa planta. Você pode usar o nome popular ou inventar um carinhoso.
        </Body>

        <View style={{ marginTop: 24 }}>
          <Input
            label="Apelido"
            value={nickname}
            onChangeText={setNickname}
            placeholder={current.identification.commonName}
            autoFocus
            maxLength={40}
            hint={`Espécie: ${current.identification.scientificName}`}
          />
        </View>

        <View style={{ marginTop: 'auto', gap: 12 }}>
          <Button
            label="Salvar no jardim"
            iconLeft="plus"
            fullWidth
            size="lg"
            disabled={!nickname.trim()}
            onPress={save}
          />
          <Button label="Cancelar" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
