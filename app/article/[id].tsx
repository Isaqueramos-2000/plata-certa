import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarkdownText } from '@/components/plant/MarkdownText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Body, Caption, Heading } from '@/components/ui/Text';
import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';
import { getArticleById } from '@/assets/mocks/articles';

const WEB_MAX_WIDTH = 480;

const LEVEL_VARIANT = {
  iniciante: 'success' as const,
  'intermediário': 'warning' as const,
  'avançado': 'danger' as const,
};

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
          }}
        >
          <IconSymbol name="book.fill" size={64} color={colors.sage} />
          <Heading level={2}>Artigo não encontrado</Heading>
          <Button label="Voltar" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
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
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Button
            label="Voltar"
            iconLeft="chevron.left"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Badge label={article.level} variant={LEVEL_VARIANT[article.level]} />
            <Caption tone="mute">{article.readTimeMin} min de leitura</Caption>
          </View>
          <Heading level={1}>{article.title}</Heading>
          <Body tone="soft" className="mt-2" style={{ fontStyle: 'italic' }}>
            {article.summary}
          </Body>
          <View
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: colors.creamDark,
            }}
          >
            <MarkdownText text={article.content} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
