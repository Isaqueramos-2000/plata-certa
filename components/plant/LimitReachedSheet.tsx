import { router } from 'expo-router';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Determina a mensagem mostrada. */
  reason: 'trial-exhausted' | 'monthly-exhausted';
};

/**
 * Modal mostrado quando o usuário tenta identificar mas atingiu o limite.
 *
 * - trial-exhausted: usuário free terminou as 3 do trial → mostra paywall
 * - monthly-exhausted: usuário pro terminou as 30 do mês → informa data de reset
 */
export function LimitReachedSheet({ visible, onClose, reason }: Props) {
  const isTrial = reason === 'trial-exhausted';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 31, 27, 0.55)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.cream,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 36,
            gap: 16,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.sageLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol
              name={isTrial ? 'leaf.fill' : 'drop.fill'}
              size={32}
              color={colors.sageDark}
            />
          </View>

          <View style={{ gap: 8, alignItems: 'center' }}>
            <Heading level={2} style={{ textAlign: 'center' }}>
              {isTrial
                ? 'Você usou suas 3 identificações grátis'
                : 'Limite mensal atingido'}
            </Heading>
            <Body tone="soft" style={{ textAlign: 'center', maxWidth: 320 }}>
              {isTrial
                ? 'Assine para continuar identificando plantas e desbloquear todos os recursos.'
                : 'Você atingiu 30 identificações neste mês. O limite renova no primeiro dia do próximo mês.'}
            </Body>
          </View>

          <View style={{ gap: 8, marginTop: 8 }}>
            {isTrial ? (
              <Button
                label="Ver planos"
                fullWidth
                size="lg"
                onPress={() => {
                  onClose();
                  router.push('/paywall');
                }}
              />
            ) : null}
            <Button
              label={isTrial ? 'Agora não' : 'Entendi'}
              variant="ghost"
              fullWidth
              onPress={onClose}
            />
          </View>

          {isTrial ? (
            <Caption tone="mute" style={{ textAlign: 'center' }}>
              A partir de R$ 8,33/mês no plano anual
            </Caption>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
