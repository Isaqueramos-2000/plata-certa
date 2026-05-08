import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Contador de perguntas de Q&A usadas pelo usuário (lifetime, sem reset).
 *
 * Limite inicial baixo (10) pra controlar custo enquanto a base não tem
 * monetização. Quando entrar uma assinatura, ela troca o `limit` por
 * algum tier (50/200/ilimitado) — interface está pronta pra isso.
 */

const DEFAULT_LIMIT = 10;

type State = {
  used: number;
  limit: number;
  /** Incrementa o contador. Idempotente em caso de chamada duplicada. */
  increment: () => void;
  /** Define um novo limite (ex: ao ativar assinatura). */
  setLimit: (limit: number) => void;
  /** Apaga o contador. Útil em desenvolvimento. */
  reset: () => void;
};

export const useQuestionsStore = create<State>()(
  persist(
    (set) => ({
      used: 0,
      limit: DEFAULT_LIMIT,
      increment: () => set((s) => ({ used: s.used + 1 })),
      setLimit: (limit) => set({ limit }),
      reset: () => set({ used: 0, limit: DEFAULT_LIMIT }),
    }),
    {
      name: 'plantacerta:questions',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Quantas perguntas ainda restam ao usuário. */
export function useQuestionsRemaining(): number {
  return useQuestionsStore((s) => Math.max(0, s.limit - s.used));
}

/** Se o usuário ainda pode perguntar. */
export function useCanAsk(): boolean {
  return useQuestionsStore((s) => s.used < s.limit);
}
