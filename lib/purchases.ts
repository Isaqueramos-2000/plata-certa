/**
 * Wrapper sobre react-native-purchases (RevenueCat).
 *
 * Modo demo (sem chave RevenueCat): retorna ofertas locais hardcoded e simula
 * compras chamando os callbacks com sucesso. Útil para desenvolver/testar
 * o fluxo de paywall ANTES de configurar os produtos no Google Play Console.
 *
 * Modo real (com chave): delega para o SDK do RevenueCat, que cuida do fluxo
 * de billing nativo do Play Store e da verificação criptográfica do receipt.
 */

import { Platform } from 'react-native';

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type PlanId = 'weekly' | 'monthly' | 'yearly';

export type Offering = {
  identifier: PlanId;
  priceString: string;       // ex: "R$ 19,90"
  priceAmount: number;        // ex: 19.90
  pricePerMonthString?: string; // só para yearly (~R$ 8,33/mês)
  title: string;
  description: string;
  highlight?: 'best' | null;
};

export type PurchaseResult =
  | { kind: 'success'; plan: PlanId }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

// ─── Ofertas demo (fallback quando RevenueCat não está configurado) ──────────

export const DEMO_OFFERINGS: Offering[] = [
  {
    identifier: 'weekly',
    priceString: 'R$ 9,90',
    priceAmount: 9.9,
    title: 'Semanal',
    description: 'Cobrado toda semana',
    highlight: null,
  },
  {
    identifier: 'monthly',
    priceString: 'R$ 19,90',
    priceAmount: 19.9,
    title: 'Mensal',
    description: 'Cobrado todo mês',
    highlight: null,
  },
  {
    identifier: 'yearly',
    priceString: 'R$ 99,90',
    priceAmount: 99.9,
    pricePerMonthString: 'R$ 8,33/mês',
    title: 'Anual',
    description: '58% de desconto — melhor escolha',
    highlight: 'best',
  },
];

// ─── Estado interno ──────────────────────────────────────────────────────────

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

/**
 * True se temos chave válida E plataforma suportada E está OK usar a chave.
 *
 * IMPORTANTE: o RevenueCat bloqueia builds release que usam chave `test_*`
 * — isso é uma proteção deles contra compras acidentais. Detectamos esse
 * cenário e caímos para modo demo local (sem o crash do "Wrong API Key").
 *
 * Quando o usuário trocar para a chave de produção (sem prefixo `test_`),
 * o comportamento real volta automaticamente nos builds release.
 */
function isReal(): boolean {
  if (API_KEY.length === 0) return false;
  if (Platform.OS === 'web') return false;
  // Chave de teste num build release → modo demo (evita crash do RC)
  if (API_KEY.startsWith('test_') && !__DEV__) return false;
  return true;
}

let _initialized = false;

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Inicializa o RevenueCat. Em modo demo, é um no-op silencioso.
 * Chame uma vez no startup do app, depois do Firebase auth.
 */
export async function initPurchases(uid: string | null): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  if (!isReal()) {
    console.log('[purchases] modo demo (sem chave RevenueCat)');
    return;
  }

  try {
    // Import dinâmico — evita carregar o SDK nativo na web ou no demo
    const Purchases = (await import('react-native-purchases')).default;
    Purchases.configure({ apiKey: API_KEY, appUserID: uid ?? undefined });
  } catch (err) {
    console.warn('[purchases] falha ao inicializar:', err);
  }
}

// ─── Ofertas ─────────────────────────────────────────────────────────────────

export async function getOfferings(): Promise<Offering[]> {
  if (!isReal()) return DEMO_OFFERINGS;

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return DEMO_OFFERINGS;

    const mapped: Offering[] = [];
    if (current.weekly) mapped.push(toOffering(current.weekly, 'weekly'));
    if (current.monthly) mapped.push(toOffering(current.monthly, 'monthly'));
    if (current.annual) mapped.push(toOffering(current.annual, 'yearly'));
    return mapped.length > 0 ? mapped : DEMO_OFFERINGS;
  } catch (err) {
    console.warn('[purchases] erro buscando ofertas, usando demo:', err);
    return DEMO_OFFERINGS;
  }
}

// ─── Compra ──────────────────────────────────────────────────────────────────

/**
 * Dispara o fluxo de compra do Google Play. Em modo demo, simula sucesso
 * imediato — útil pra testar a UI sem precisar do Play Console configurado.
 */
export async function purchase(plan: PlanId): Promise<PurchaseResult> {
  if (!isReal()) {
    // Demo: simula compra bem-sucedida
    await new Promise((r) => setTimeout(r, 800)); // delay pra parecer real
    return { kind: 'success', plan };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const pkg =
      plan === 'weekly'  ? offerings.current?.weekly :
      plan === 'monthly' ? offerings.current?.monthly :
                           offerings.current?.annual;
    if (!pkg) return { kind: 'error', message: 'Plano indisponível.' };

    await Purchases.purchasePackage(pkg);
    return { kind: 'success', plan };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { kind: 'cancelled' };
    return { kind: 'error', message: e.message ?? 'Erro na compra.' };
  }
}

// ─── Restaurar compras ───────────────────────────────────────────────────────

export async function restorePurchases(): Promise<{ hasPro: boolean }> {
  if (!isReal()) return { hasPro: false };

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.restorePurchases();
    return { hasPro: hasProEntitlement(info) };
  } catch (err) {
    console.warn('[purchases] falha ao restaurar:', err);
    return { hasPro: false };
  }
}

// ─── Customer info (sync) ────────────────────────────────────────────────────

/**
 * Retorna se o usuário tem entitlement Pro ativo agora.
 * Em modo demo, retorna false (a fonte de verdade é o subscriptionStore local).
 */
export async function hasActivePro(): Promise<boolean> {
  if (!isReal()) return false;

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    return hasProEntitlement(info);
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type RcPackage = {
  product: {
    priceString: string;
    price: number;
    title: string;
    description: string;
  };
};

function toOffering(pkg: RcPackage, identifier: PlanId): Offering {
  return {
    identifier,
    priceString: pkg.product.priceString,
    priceAmount: pkg.product.price,
    title: pkg.product.title,
    description: pkg.product.description,
    highlight: identifier === 'yearly' ? 'best' : null,
    pricePerMonthString: identifier === 'yearly'
      ? `${formatPerMonth(pkg.product.price)}/mês`
      : undefined,
  };
}

function formatPerMonth(yearlyPrice: number): string {
  const perMonth = yearlyPrice / 12;
  return `R$ ${perMonth.toFixed(2).replace('.', ',')}`;
}

function hasProEntitlement(info: { entitlements: { active: Record<string, unknown> } }): boolean {
  return Boolean(info.entitlements.active['pro']);
}
