import { View } from 'react-native';

import { ARTICLES } from '@/assets/mocks/articles';
import { ArticleCard } from '@/components/plant/ArticleCard';
import { Screen } from '@/components/ui/Screen';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors } from '@/lib/theme';

export default function LearnScreen() {
  return (
    <Screen scroll>
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Heading level={1}>{t('learn.title')}</Heading>
        <Body tone="soft" className="mt-2">
          Leia os guias rápidos sobre cuidados com plantas.
        </Body>
      </View>

      <View
        style={{
          marginTop: 24,
          paddingTop: 8,
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
