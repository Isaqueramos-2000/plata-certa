import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import type { Article } from '@/assets/mocks/articles';

type Props = {
  article: Article;
};

const LEVEL_VARIANT: Record<Article['level'], 'success' | 'warning' | 'danger'> = {
  iniciante: 'success',
  'intermediário': 'warning',
  'avançado': 'danger',
};

export function ArticleCard({ article }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Artigo: ${article.title}`}
      onPress={() => router.push(`/article/${article.id}`)}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.creamDark,
        padding: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.sageLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="book.fill" size={20} color={colors.sageDark} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Badge label={article.level} variant={LEVEL_VARIANT[article.level]} />
            <Caption tone="mute">{article.readTimeMin} min</Caption>
          </View>
          <Heading level={3} className="mt-2">
            {article.title}
          </Heading>
          <Body size="small" tone="soft" className="mt-1">
            {article.summary}
          </Body>
        </View>
      </View>
    </Pressable>
  );
}
