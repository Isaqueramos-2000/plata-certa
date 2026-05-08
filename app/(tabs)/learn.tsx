import { View } from 'react-native';

import { ARTICLES } from '@/assets/mocks/articles';
import { ArticleCard } from '@/components/plant/ArticleCard';
import { AskPanel } from '@/components/plant/AskPanel';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { askGeneralPlantQuestion } from '@/services/plantChat';
import { useLearnChatStore } from '@/stores/learnChatStore';

const CHIPS = ['Como adubar?', 'Sol direto?', 'Quando podar?'];

export default function LearnScreen() {
  const history = useLearnChatStore((s) => s.history);
  const append = useLearnChatStore((s) => s.append);

  return (
    <Screen scroll>
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Heading level={1}>{t('learn.title')}</Heading>
        <Body tone="soft" className="mt-2">
          Tire dúvidas com a IA ou leia os guias rápidos.
        </Body>
      </View>

      <View style={{ marginTop: 24 }}>
        <AskPanel
          history={history}
          onAsk={(q, h) => askGeneralPlantQuestion(q, h)}
          onExchange={(q, a) => append(q, a)}
          title="Pergunte para a IA"
          subtitle="Use a mesma cota de 10 perguntas. Suas conversas ficam salvas aqui."
          placeholder="Ex: como saber se devo regar?"
          chips={CHIPS}
        />
      </View>

      <View
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: colors.creamDark,
        }}
      >
        <Caption tone="mute" style={{ letterSpacing: 1 }}>
          GUIAS RÁPIDOS
        </Caption>
        <View style={{ marginTop: 12, gap: 12 }}>
          {ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
