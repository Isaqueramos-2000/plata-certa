import { Text, View } from 'react-native';

import { Body } from '@/components/ui/Text';

type Props = {
  text: string;
  /** Tom passado pros parágrafos. */
  tone?: 'default' | 'inverse' | 'soft';
};

/**
 * Renderiza markdown leve do Claude:
 *  - **negrito**
 *  - listas com `- item`
 *  - parágrafos separados por linha em branco
 *
 * Preferimos um parser próprio pequeno em vez de uma lib pesada porque
 * o Haiku gera só esses 3 padrões (definido no prompt). Se ele começar
 * a usar mais (links, headings, código), trocar por `react-native-markdown-display`.
 */
export function MarkdownText({ text, tone = 'default' }: Props) {
  const blocks = parseBlocks(text);
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((block, i) => {
        if (block.kind === 'list') {
          return (
            <View key={i} style={{ gap: 4 }}>
              {block.items.map((item, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <Body size="small" tone={tone} style={{ marginTop: 0 }}>
                    •
                  </Body>
                  <Body size="small" tone={tone} style={{ flex: 1 }}>
                    <Inline text={item} tone={tone} />
                  </Body>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Body key={i} size="small" tone={tone}>
            <Inline text={block.text} tone={tone} />
          </Body>
        );
      })}
    </View>
  );
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphBuf: string[] = [];
  let listBuf: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuf.length) {
      blocks.push({ kind: 'paragraph', text: paragraphBuf.join(' ') });
      paragraphBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf.length) {
      blocks.push({ kind: 'list', items: listBuf });
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      listBuf.push(line.slice(2).trim());
    } else {
      flushList();
      paragraphBuf.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

/**
 * Renderiza um trecho inline tratando `**bold**`. Retorna nodes
 * de Text aninhados — RN suporta nesting de Text e isso permite
 * o bold ficar inline sem quebrar a linha.
 */
function Inline({ text, tone }: { text: string; tone: 'default' | 'inverse' | 'soft' }) {
  // Split por **...** mantendo os delimitadores no resultado
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: '700' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </>
  );
}
