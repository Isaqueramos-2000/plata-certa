/**
 * Camada de identificação — Arquitetura B com backend proxy.
 *
 * Fluxo:
 *   Stage 1 (backend) ──► nome científico + confiança
 *          │
 *          └──► cache local por nome científico
 *                 │
 *                 ├─ HIT  ──► retorna guia cacheado (custo zero)
 *                 │
 *                 └─ MISS ──► Stage 2 (backend) gera guia completo
 *                              e salva no cache local
 *
 * Segurança:
 *   - A chave Anthropic fica APENAS no servidor (api/identify.ts)
 *   - O app envia imageBase64 + X-Device-ID para /api/identify
 *   - O backend aplica rate limit de 20 identificações/hora/device
 */

import {
  getMockIdentification,
  MOCK_IDENTIFICATIONS,
} from '@/assets/mocks/identifications';
import { getDeviceId } from '@/lib/deviceId';
import { getFirebaseToken } from '@/lib/firebase';
import { parseAndValidate } from '@/services/jsonParser';
import { getCached, setCached } from '@/services/speciesCache';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { PlantIdentification } from '@/types/plant';

/**
 * URL base do backend proxy.
 * - Desenvolvimento: defina EXPO_PUBLIC_API_URL=http://localhost:3000 no .env
 *   e rode `vercel dev` em paralelo com `npx expo start --web`.
 * - Produção (Vercel): deixe em branco — usa a mesma origem do app web,
 *   e a URL absoluta para o app mobile.
 */
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://plata-certa.vercel.app';

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
  return process.env.EXPO_PUBLIC_USE_MOCK === 'true';
}

// ─── Chamada ao backend proxy ─────────────────────────────────────────────────

type QuickResult = {
  identified: boolean;
  confidence: 'high' | 'medium' | 'low';
  scientificName: string;
  commonName: string;
};

async function callBackend(
  stage: 'quick' | 'full',
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
): Promise<unknown> {
  const [deviceId, firebaseToken] = await Promise.all([
    getDeviceId(),
    getFirebaseToken().catch(() => null),
  ]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    // Informa o tier do usuário para auditoria/log no backend.
    // V1: client-side. V2 (futuro): backend valida via webhook RevenueCat.
    'X-Subscription-Tier': useSubscriptionStore.getState().entitlement,
  };
  // Se Firebase estiver configurado, envia o token JWT para verificação
  // criptográfica no backend — muito mais seguro que só o device ID.
  if (firebaseToken) {
    headers['Authorization'] = `Bearer ${firebaseToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/identify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64, mimeType, stage }),
    });
  } catch {
    throw asError('network', 'Sem conexão. Verifique sua internet e tente de novo.');
  }

  if (response.status === 429) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw asError('rate-limited', body.message ?? 'Muitas tentativas. Aguarde alguns minutos.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    const msg = body.message ?? 'Erro no servidor. Tente novamente.';
    throw asError('unknown', msg);
  }

  return response.json();
}

// ─── Identificação principal ──────────────────────────────────────────────────

export async function identifyPlant(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<IdentifyResult> {
  if (isMockEnabled()) {
    await delay(MOCK_DELAY_MS);
    const idx = Math.floor(Math.random() * MOCK_IDENTIFICATIONS.length);
    return { identification: getMockIdentification(idx), source: 'mock' };
  }

  // Stage 1 — identificação rápida para obter o nome científico
  const quickRaw = await callBackend('quick', imageBase64, mimeType);
  const quick = parseAndValidate<QuickResult>(
    JSON.stringify(quickRaw),
    ['identified', 'scientificName'],
  );

  // Cache lookup — se já temos o guia desta espécie, não precisamos do Stage 2
  if (quick.identified && quick.scientificName) {
    const cached = await getCached(quick.scientificName);
    if (cached) {
      return {
        identification: { ...cached, confidence: quick.confidence },
        source: 'cache',
      };
    }
  }

  // Stage 2 — guia completo (cache miss)
  const fullRaw = await callBackend('full', imageBase64, mimeType);
  const full = parseAndValidate<PlantIdentification>(JSON.stringify(fullRaw), [
    'commonName',
    'scientificName',
    'care',
    'calendar',
    'commonProblems',
    'funFacts',
    'difficulty',
  ]);

  // Persiste no cache local para próximas identificações desta espécie
  if (full.identified && full.scientificName) {
    setCached(full).catch((err) => console.warn('[plantAI] cache write failed:', err));
  }

  return { identification: full, source: 'live' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asError(kind: IdentifyError['kind'], message: string): Error & IdentifyError {
  const err = new Error(message) as Error & IdentifyError;
  err.kind = kind;
  return err;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converte erros desconhecidos em IdentifyError amigáveis para a UI.
 */
export function toIdentifyError(err: unknown): IdentifyError {
  if (err && typeof err === 'object' && 'kind' in err) {
    return err as IdentifyError;
  }
  if (err instanceof Error && /network|fetch|conexão/i.test(err.message)) {
    return { kind: 'network', message: 'Sem conexão. Verifique sua internet e tente de novo.' };
  }
  return { kind: 'unknown', message: 'Algo inesperado aconteceu. Tente novamente.' };
}
