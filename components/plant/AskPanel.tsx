import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { MarkdownText } from '@/components/plant/MarkdownText';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { useFontScale, useTouchTarget } from '@/stores/settingsStore';
import { useQuestionsStore } from '@/stores/questionsStore';
import type { ChatMessage } from '@/types/plant';

type Props = {
  /** Histórico já existente da conversa (vem do gardenStore por planta ou learnChatStore geral). */
  history: ChatMessage[];
  /** Faz a chamada ao Claude. O painel não conhece o contexto (planta ou geral). */
  onAsk: (question: string, history: ChatMessage[]) => Promise<string>;
  /** Chamada quando o par pergunta+resposta é finalizado, pra UI persistir. */
  onExchange: (question: ChatMessage, answer: ChatMessage) => void;

  title?: string;
  subtitle?: string;
  placeholder?: string;
  chips?: string[];
};

const DEFAULTS = {
  title: 'Tem alguma dúvida?',
  placeholder: 'Ex: minhas folhas estão caindo, o que faço?',
  chips: ['Folhas amareladas?', 'Como regar?', 'Pragas?'],
};

export function AskPanel({
  history,
  onAsk,
  onExchange,
  title = DEFAULTS.title,
  subtitle,
  placeholder = DEFAULTS.placeholder,
  chips = DEFAULTS.chips,
}: Props) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const minTouch = useTouchTarget();
  const scale = useFontScale();
  const used = useQuestionsStore((s) => s.used);
  const limit = useQuestionsStore((s) => s.limit);
  const increment = useQuestionsStore((s) => s.increment);
  const remaining = Math.max(0, limit - used);
  const canAsk = remaining > 0;

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || loading || !canAsk) return;
    setError(null);
    setDraft('');
    setLoading(true);
    try {
      const answerText = await onAsk(question, history);
      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: answerText,
        createdAt: new Date().toISOString(),
      };
      onExchange(userMsg, assistantMsg);
      increment();
    } catch (err) {
      console.warn('[AskPanel] erro:', err);
      setError('Não consegui responder agora. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Heading level={3}>{title}</Heading>
        <Caption tone={canAsk ? 'mute' : 'danger'}>
          {used}/{limit} usadas
        </Caption>
      </View>
      {subtitle ? (
        <Body size="small" tone="soft" style={{ marginTop: 4 }}>
          {subtitle}
        </Body>
      ) : null}

      {canAsk ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
            }}
          >
            {chips.map((label) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                disabled={loading}
                onPress={() => send(label)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: pressed ? colors.creamDark : colors.white,
                  borderWidth: 1,
                  borderColor: colors.creamDark,
                  opacity: loading ? 0.6 : 1,
                })}
              >
                <Body size="small">{label}</Body>
              </Pressable>
            ))}
          </View>

          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <TextInput
              ref={inputRef}
              accessibilityLabel="Pergunta"
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={colors.inkMute}
              multiline
              maxLength={300}
              editable={!loading}
              onSubmitEditing={() => send(draft)}
              style={{
                flex: 1,
                minHeight: minTouch,
                maxHeight: minTouch * 2.5,
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 12,
                backgroundColor: colors.white,
                borderWidth: 1.5,
                borderColor: colors.creamDark,
                color: colors.ink,
                fontSize: 16 * scale,
                fontFamily: 'Inter_400Regular',
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar pergunta"
              accessibilityState={{ disabled: loading || !draft.trim() }}
              disabled={loading || !draft.trim()}
              onPress={() => send(draft)}
              style={({ pressed }) => ({
                width: minTouch,
                height: minTouch,
                borderRadius: 12,
                backgroundColor: !draft.trim()
                  ? colors.creamDark
                  : pressed
                    ? colors.sageDark
                    : colors.sage,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.6 : 1,
              })}
            >
              {loading ? (
                <ActivityIndicator color={colors.cream} />
              ) : (
                <IconSymbol name="paperplane.fill" size={20} color={colors.cream} />
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <LimitReached />
      )}

      {error ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#F4D7D1',
          }}
        >
          <Body size="small" style={{ color: colors.danger }}>
            {error}
          </Body>
        </View>
      ) : null}

      {history.length > 0 ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          {history.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          maxWidth: '85%',
          backgroundColor: isUser ? colors.sage : colors.white,
          borderColor: isUser ? colors.sageDark : colors.creamDark,
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {isUser ? (
          <Body size="small" tone="inverse">
            {message.content}
          </Body>
        ) : (
          // Respostas do assistente vêm com markdown (negrito, listas).
          // O MarkdownText cuida de transformar isso em RN nodes.
          <MarkdownText text={message.content} tone="default" />
        )}
      </View>
    </View>
  );
}

function LimitReached() {
  const reset = useQuestionsStore((s) => s.reset);
  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.creamDark,
      }}
    >
      <Body size="small" tone="default" style={{ fontWeight: '600' }}>
        Você usou todas as suas perguntas grátis.
      </Body>
      <Caption tone="soft" style={{ marginTop: 4 }}>
        Em breve, planos com mais perguntas e histórico ilimitado.
      </Caption>
      {__DEV__ ? (
        <View style={{ marginTop: 12 }}>
          <Button label="Resetar contador (dev)" variant="ghost" onPress={reset} />
        </View>
      ) : null}
    </View>
  );
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
