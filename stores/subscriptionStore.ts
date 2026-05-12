import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlanId } from '@/lib/purchases';

/**
 * Estado da assinatura — fonte de verdade local para gating de uso.
 *
 * V1: client-side. O contador de uso é decrementado localmente após cada
 * identificação bem-sucedida. Compras vindas do RevenueCat sincronizam
 * `entitlement` via `markPro()`.
 *
 * V2 (futuro): server-side via webhook RevenueCat → Vercel KV.
 */

export type Entitlement = 'free' | 'pro';

export const TRIAL_MAX = 3;
export const MONTHLY_MAX = 30;

type State = {
  entitlement: Entitlement;
  plan: PlanId | null;
  expiresAt: string | null;

  /** Identificações usadas no trial (lifetime, 0 a TRIAL_MAX). */
  trialUsed: number;

  /** Identificações usadas no mês corrente (0 a MONTHLY_MAX). */
  monthlyUsed: number;

  /** ISO date — quando o contador mensal vai resetar. */
  monthlyResetAt: string;

  // Actions
  markPro: (plan: PlanId, expiresAt: string | null) => void;
  markFree: () => void;
  consumeOne: () => void;
  resetMonthlyIfNeeded: () => void;
  /** Útil em desenvolvimento e em "começar de novo" do perfil. */
  resetAll: () => void;
};

function nextMonthIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const useSubscriptionStore = create<State>()(
  persist(
    (set, get) => ({
      entitlement: 'free',
      plan: null,
      expiresAt: null,
      trialUsed: 0,
      monthlyUsed: 0,
      monthlyResetAt: nextMonthIso(),

      markPro: (plan, expiresAt) =>
        set({
          entitlement: 'pro',
          plan,
          expiresAt,
          monthlyUsed: 0,
          monthlyResetAt: nextMonthIso(),
        }),

      markFree: () =>
        set({
          entitlement: 'free',
          plan: null,
          expiresAt: null,
        }),

      consumeOne: () => {
        const s = get();
        if (s.entitlement === 'pro') {
          // Reset mensal lazy: se passou da data, zera antes de incrementar
          if (Date.now() >= new Date(s.monthlyResetAt).getTime()) {
            set({ monthlyUsed: 1, monthlyResetAt: nextMonthIso() });
          } else {
            set({ monthlyUsed: s.monthlyUsed + 1 });
          }
        } else {
          set({ trialUsed: Math.min(s.trialUsed + 1, TRIAL_MAX) });
        }
      },

      resetMonthlyIfNeeded: () => {
        const s = get();
        if (Date.now() >= new Date(s.monthlyResetAt).getTime()) {
          set({ monthlyUsed: 0, monthlyResetAt: nextMonthIso() });
        }
      },

      resetAll: () =>
        set({
          entitlement: 'free',
          plan: null,
          expiresAt: null,
          trialUsed: 0,
          monthlyUsed: 0,
          monthlyResetAt: nextMonthIso(),
        }),
    }),
    {
      name: 'plantacerta:subscription',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
