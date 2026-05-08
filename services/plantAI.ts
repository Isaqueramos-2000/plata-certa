import Anthropic from '@anthropic-ai/sdk';

import {
  getMockIdentification,
  MOCK_IDENTIFICATIONS,
} from '@/assets/mocks/identifications';
import { isWeb } from '@/lib/platform';
import { parseAndValidate } from '@/services/jsonParser';
import { getCached, setCached } from '@/services/speciesCache';
import type { PlantIdentification } from '@/types/plant';

/**
 * Camada de identificação. Implementa a Arquitetura B do projeto:
 *
 *  Stage 1 (Haiku, barato) ─► nome científico + confiança
 *           │
 *           └─► consulta cache local por nome científico
 *                  │
 *                  ├─ HIT  ─► retorna o guia cacheado, sem custo extra
 *                  │
 *                  └─ MISS ─► Stage 2 (Sonnet) gera o guia completo
 *                              e salva no cache pra próximos usuários.
 *
 * Custos típicos:
 *   - Cache hit:  ~$0.002 (só Haiku)
 *   - Cache miss: ~$0.014 (Haiku + Sonnet)
 *
 *  TODO produção: mover esta chamada pra um backend (Cloudflare Worker
 *  ou Lambda) pra não expor a API key no bundle do app, e pra que o
 *  cache seja COMPARTILHADO entre os usuários (Supabase). Hoje cada
 *  device tem seu próprio cache, então o ganho é apenas dentro do
 *  histórico individual do usuário.
 */

const STAGE1_MODEL = 'claude-haiku-4-5-20251001';
// Haiku 4.5 é 3x mais barato que Sonnet 4.6 ($1/$5 vs $3/$15 por MTok)
// e suficiente pra estruturar JSON de cuidados. Custo cold-cache cai
// de ~$0.019 pra ~$0.006 por identificação. Caso a confiança volte
// "low" com frequência, dá pra escalar pra Sonnet só nesses casos.
const STAGE2_MODEL = 'claude-haiku-4-5-20251001';
const MOCK_DELAY_MS = 1500;

export type IdentifySource = 'cache' | 'live' | 'mock';

export type IdentifyResult = {
  identification: PlantIdentification;
  source: IdentifySource;
};

export type IdentifyError = {
  kind: 'no-api-key' | 'network' | 'malformed' | 'rate-limited' | 'unknown';
  message: string;
};

export const ANALYSIS_MESSAGES = [
  'Consultando o herbário…',
  'Analisando folhagem…',
  'Comparando com o nosso banco…',
  'Verificando padrões de luz…',
  'Quase lá…',
];

function isMockEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') return true;
  return !process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
}

function getClient(): Anthropic {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw asError('no-api-key', 'A chave da API ainda não foi configurada.');
  }
  return new Anthropic({
    apiKey,
    // O SDK normalmente bloqueia uso direto do navegador. No MVP
    // chamamos a API a partir do bundle web; em produção isso vai pra
    // backend e essa flag deve ser removida.
    dangerouslyAllowBrowser: isWeb,
  });
}

/**
 * Identifica uma planta a partir de uma imagem em base64. Não inclui
 * o prefixo `data:image/...` — apenas o conteúdo base64 cru.
 *
 * @param imageBase64 conteúdo base64 da imagem
 * @param mimeType opcional, default `image/jpeg`
 */
export async function identifyPlant(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<IdentifyResult> {
  if (isMockEnabled()) {
    await delay(MOCK_DELAY_MS);
    const idx = Math.floor(Math.random() * MOCK_IDENTIFICATIONS.length);
    return { identification: getMockIdentification(idx), source: 'mock' };
  }

  const client = getClient();

  // Stage 1: identificação rápida só pra obter o nome científico.
  const quick = await callQuickIdentify(client, imageBase64, mimeType);

  // Cache lookup
  if (quick.identified && quick.scientificName) {
    const cached = await getCached(quick.scientificName);
    if (cached) {
      return {
        identification: { ...cached, confidence: quick.confidence },
        source: 'cache',
      };
    }
  }

  // Stage 2: chamada completa pra gerar o guia.
  const full = await callFullIdentify(client, imageBase64, mimeType);
  if (full.identified && full.scientificName) {
    setCached(full).catch((err) => console.warn('[plantAI] cache write failed:', err));
  }
  return { identification: full, source: 'live' };
}

// ─────────────────────────────────────────────────────────
// Stage 1: identificação leve (Haiku)
// ─────────────────────────────────────────────────────────

const STAGE1_SYSTEM = `Você é um assistente de identificação de plantas. Analise a imagem e retorne SOMENTE um JSON com a forma exata abaixo, sem markdown e sem comentários:

{
  "identified": boolean,
  "confidence": "high" | "medium" | "low",
  "scientificName": string,
  "commonName": string
}

Regras:
- "commonName" em português brasileiro.
- Se a imagem não mostra uma planta com clareza, use identified=false, confidence="low" e strings vazias.
- Não inclua nenhum texto fora do JSON.`;

type QuickIdentification = {
  identified: boolean;
  confidence: 'high' | 'medium' | 'low';
  scientificName: string;
  commonName: string;
};

async function callQuickIdentify(
  client: Anthropic,
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
): Promise<QuickIdentification> {
  const response = await client.messages.create({
    model: STAGE1_MODEL,
    max_tokens: 256,
    system: [
      // O prompt cache da Anthropic guarda o system prompt por 5min,
      // dropando ~90% do custo de input em chamadas seguidas.
      { type: 'text', text: STAGE1_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          { type: 'text', text: 'Identifique esta planta.' },
        ],
      },
    ],
  });

  const text = extractText(response);
  return parseAndValidate<QuickIdentification>(text, ['identified', 'scientificName']);
}

// ─────────────────────────────────────────────────────────
// Stage 2: guia completo (Sonnet)
// ─────────────────────────────────────────────────────────

const STAGE2_SYSTEM = `Você é um especialista em plantas escrevendo em português brasileiro para um aplicativo usado por jovens e idosos. Use linguagem clara, sem jargão, frases curtas e tom acolhedor.

Analise a imagem e retorne SOMENTE um JSON com esta forma exata, sem markdown e sem comentários:

{
  "identified": boolean,
  "confidence": "high" | "medium" | "low",
  "commonName": string,
  "scientificName": string,
  "family": string,
  "description": string,
  "care": {
    "light": string,
    "water": string,
    "waterFrequencyDays": number,
    "soil": string,
    "temperature": string,
    "humidity": string,
    "fertilizer": string
  },
  "calendar": {
    "pruning": string,
    "repotting": string,
    "fertilizing": string
  },
  "commonProblems": [
    { "problem": string, "signs": string, "solution": string }
  ],
  "funFacts": string[],
  "difficulty": "fácil" | "médio" | "difícil"
}

Regras importantes:
- Tudo em português brasileiro, sem termos técnicos. Em vez de "abscisão foliar", use "queda das folhas".
- "description" tem 2 a 3 frases.
- "commonProblems" tem 2 a 4 itens.
- "funFacts" tem 2 a 3 itens.
- "waterFrequencyDays" é um inteiro (a frequência média em dias).
- Se a confiança for baixa, ainda assim preencha os campos com sua melhor estimativa baseada nas características visíveis.
- Não inclua nenhum texto fora do JSON.`;

async function callFullIdentify(
  client: Anthropic,
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
): Promise<PlantIdentification> {
  const response = await client.messages.create({
    model: STAGE2_MODEL,
    max_tokens: 1024,
    system: [
      { type: 'text', text: STAGE2_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'Identifique e gere o guia de cuidados completo desta planta.',
          },
        ],
      },
    ],
  });

  const text = extractText(response);
  return parseAndValidate<PlantIdentification>(text, [
    'commonName',
    'scientificName',
    'care',
    'calendar',
    'commonProblems',
    'funFacts',
    'difficulty',
  ]);
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function extractText(response: Anthropic.Messages.Message): string {
  for (const block of response.content) {
    if (block.type === 'text') return block.text;
  }
  throw asError('malformed', 'Resposta da API sem texto.');
}

function asError(kind: IdentifyError['kind'], message: string): Error & IdentifyError {
  const err = new Error(message) as Error & IdentifyError;
  err.kind = kind;
  return err;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converte erros do SDK Anthropic em IdentifyError amigáveis.
 * Use isto em chamadas de borda (UI) quando quiser mostrar mensagem.
 */
export function toIdentifyError(err: unknown): IdentifyError {
  if (err && typeof err === 'object' && 'kind' in err) {
    return err as IdentifyError;
  }
  if (err instanceof Anthropic.APIError) {
    if (err.status === 429) {
      return { kind: 'rate-limited', message: 'Muitas tentativas. Aguarde alguns instantes.' };
    }
    if (err.status && err.status >= 500) {
      return { kind: 'network', message: 'O serviço está fora do ar. Tente novamente em breve.' };
    }
    return { kind: 'unknown', message: err.message };
  }
  if (err instanceof Error && /network|fetch/i.test(err.message)) {
    return { kind: 'network', message: 'Sem conexão. Verifique sua internet e tente de novo.' };
  }
  return { kind: 'unknown', message: 'Algo inesperado aconteceu. Tente novamente.' };
}
