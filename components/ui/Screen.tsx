import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { isWeb } from '@/lib/platform';
import { colors } from '@/lib/theme';

type Props = (ViewProps | ScrollViewProps) & {
  scroll?: boolean;
  edges?: Edge[];
  /** Padding horizontal padrão das telas (24). Passe 0 para conteúdo fullbleed. */
  padded?: boolean;
  className?: string;
};

/**
 * Largura máxima do conteúdo no web. O app é mobile-first; no desktop
 * centralizamos tudo numa coluna estreita pra preservar a sensação de
 * app de celular e evitar que CTAs vão pro canto direito da tela.
 */
const WEB_MAX_WIDTH = 480;

/**
 * Wrapper padrão de tela: SafeArea + fundo cream + padding horizontal
 * consistente. No web, restringe a largura máxima e centraliza para
 * manter o visual mobile-first em desktops largos.
 */
export function Screen({
  scroll = false,
  edges = ['top'],
  padded = true,
  className = '',
  style,
  children,
  ...rest
}: Props) {
  const innerStyle = {
    flex: 1,
    width: '100%' as const,
    ...(isWeb
      ? { maxWidth: WEB_MAX_WIDTH, marginLeft: 'auto' as const, marginRight: 'auto' as const }
      : null),
  };

  const padHorizontal = padded ? 24 : 0;

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.cream }}
      className={className}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: padHorizontal,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          style={innerStyle}
          {...(rest as ScrollViewProps)}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[innerStyle, { paddingHorizontal: padHorizontal }, style]}
          {...(rest as ViewProps)}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
