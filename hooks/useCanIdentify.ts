import { useSubscriptionStore, TRIAL_MAX, MONTHLY_MAX } from '@/stores/subscriptionStore';

/**
 * Hook que diz se o usuário pode identificar uma planta agora.
 *
 * - free: pode identificar até consumir as 3 do trial (lifetime)
 * - pro:  pode identificar até consumir as 30 do mês corrente
 *
 * Quando `canIdentify === false`, mostre o paywall (free) ou aviso de
 * limite mensal (pro).
 */
export type IdentifyGate = {
  canIdentify: boolean;
  /** Quantas identificações restam (0..TRIAL_MAX ou 0..MONTHLY_MAX). */
  remaining: number;
  /** Total de identificações disponíveis no período/ciclo atual. */
  total: number;
  /** Por que o gate está nesse estado. */
  reason: 'trial' | 'pro' | 'trial-exhausted' | 'monthly-exhausted';
};

export function useCanIdentify(): IdentifyGate {
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const trialUsed = useSubscriptionStore((s) => s.trialUsed);
  const monthlyUsed = useSubscriptionStore((s) => s.monthlyUsed);
  const monthlyResetAt = useSubscriptionStore((s) => s.monthlyResetAt);

  if (entitlement === 'pro') {
    // Reset lazy do mês — se passou da data, considera 0 usados
    const effectiveUsed =
      Date.now() >= new Date(monthlyResetAt).getTime() ? 0 : monthlyUsed;
    const remaining = Math.max(0, MONTHLY_MAX - effectiveUsed);
    return {
      canIdentify: remaining > 0,
      remaining,
      total: MONTHLY_MAX,
      reason: remaining > 0 ? 'pro' : 'monthly-exhausted',
    };
  }

  // free
  const remaining = Math.max(0, TRIAL_MAX - trialUsed);
  return {
    canIdentify: remaining > 0,
    remaining,
    total: TRIAL_MAX,
    reason: remaining > 0 ? 'trial' : 'trial-exhausted',
  };
}
