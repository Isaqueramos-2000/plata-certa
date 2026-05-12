/**
 * Vercel Serverless Function — proxy seguro para a Anthropic API.
 *
 * Por que existe este arquivo?
 * ----------------------------
 * A chave da Anthropic (ANTHROPIC_API_KEY) fica APENAS neste servidor.
 * O app mobile/web nunca vê a chave — ele só chama este endpoint.
 *
 * Rate limiting: 20 identificações por hora por device ID.
 * Produção: substitua _rateMap por Vercel KV para persistir entre instâncias.
 *
 * Endpoints:
 *   POST /api/identify  { imageBase64, mimeType, stage: 'quick'|'full' }
 *
 * Headers obrigatórios:
 *   X-Device-ID  — UUID gerado pelo app na primeira instalação
 */

import Anthropic from '@anthropic-ai/sdk';

// ─── Tipos inline (evita depender de @vercel/node no bundle Expo) ────────────

type Req = {
  method?: string;
  body: {
    imageBase64?: string;
    mimeType?: 'image/jpeg' | 'image/png';
    stage?: 'quick' | 'full';
  };
  headers: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
};

// ─── Rate limiting em memória ────────────────────────────────────────────────
// Suficiente para evitar abuso casual. Para múltiplas instâncias simultâneas
// use Vercel KV: https://vercel.com/docs/storage/vercel-kv

const _rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;       // identificações por hora
const HOUR_MS   = 3_600_000;

function checkRate(id: string): boolean {
  const now = Date.now();
  const e   = _rateMap.get(id);
  if (!e || now >= e.resetAt) {
    _rateMap.set(id, { count: 1, resetAt: now + HOUR_MS });
    return true;
  }
  if (e.count >= RATE_LIMIT) return false;
  e.count++;
  return true;
}

// ─── Cliente Anthropic (singleton por instância) ─────────────────────────────

let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY não configurada no servidor.');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ─── Modelos ─────────────────────────────────────────────────────────────────

const STAGE1_MODEL = 'claude-haiku-4-5-20251001';
const STAGE2_MODEL = 'claude-haiku-4-5-20251001';

// ─── Prompts ─────────────────────────────────────────────────────────────────

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
- Tudo em português brasileiro, sem termos técnicos.
- "description" tem 2 a 3 frases.
- "commonProblems" tem 2 a 4 itens.
- "funFacts" tem 2 a 3 itens.
- "waterFrequencyDays" é um inteiro (frequência média em dias).
- Se a confiança for baixa, preencha os campos com sua melhor estimativa.
- Não inclua nenhum texto fora do JSON.`;

// ─── Chamadas Anthropic ───────────────────────────────────────────────────────

function extractText(response: Anthropic.Messages.Message): string {
  for (const block of response.content) {
    if (block.type === 'text') return block.text;
  }
  throw new Error('Resposta da API sem conteúdo de texto.');
}

function parseJSON(text: string): unknown {
  // Remove cercas markdown se o modelo as incluir mesmo sendo orientado a não fazer.
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
  return JSON.parse(cleaned);
}

async function callQuickIdentify(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
): Promise<unknown> {
  const response = await getClient().messages.create({
    model: STAGE1_MODEL,
    max_tokens: 256,
    system: [{ type: 'text', text: STAGE1_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: 'Identifique esta planta.' },
      ],
    }],
  });
  return parseJSON(extractText(response));
}

async function callFullIdentify(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
): Promise<unknown> {
  const response = await getClient().messages.create({
    model: STAGE2_MODEL,
    max_tokens: 1024,
    system: [{ type: 'text', text: STAGE2_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: 'Identifique e gere o guia de cuidados completo desta planta.' },
      ],
    }],
  });
  return parseJSON(extractText(response));
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  // CORS — permite chamadas do app web (mesma origem) e do app mobile (origem diferente)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  // Identifica o dispositivo: prefere o header customizado, cai para IP
  const rawDeviceId = req.headers['x-device-id'];
  const rawForwardedFor = req.headers['x-forwarded-for'];
  const deviceId = (
    (Array.isArray(rawDeviceId) ? rawDeviceId[0] : rawDeviceId) ||
    (Array.isArray(rawForwardedFor) ? rawForwardedFor[0] : rawForwardedFor)?.split(',')[0].trim() ||
    'unknown'
  );

  if (!checkRate(deviceId)) {
    res.status(429).json({
      error: 'rate-limited',
      message: 'Muitas identificações seguidas. Aguarde alguns minutos.',
    });
    return;
  }

  const { imageBase64, mimeType = 'image/jpeg', stage } = req.body ?? {};

  if (!imageBase64) {
    res.status(400).json({ error: 'bad-request', message: 'imageBase64 é obrigatório.' });
    return;
  }
  if (stage !== 'quick' && stage !== 'full') {
    res.status(400).json({ error: 'bad-request', message: 'stage deve ser "quick" ou "full".' });
    return;
  }

  try {
    const result = stage === 'quick'
      ? await callQuickIdentify(imageBase64, mimeType)
      : await callFullIdentify(imageBase64, mimeType);

    res.status(200).json(result);
  } catch (err: unknown) {
    console.error('[identify] erro:', err);

    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) {
        res.status(429).json({ error: 'rate-limited', message: 'Serviço temporariamente sobrecarregado.' });
        return;
      }
      if (err.status === 401) {
        res.status(500).json({ error: 'config-error', message: 'Chave de API inválida no servidor.' });
        return;
      }
      res.status(502).json({ error: 'upstream-error', message: 'Erro no serviço de IA.' });
      return;
    }

    res.status(500).json({ error: 'unknown', message: 'Algo inesperado aconteceu.' });
  }
}
