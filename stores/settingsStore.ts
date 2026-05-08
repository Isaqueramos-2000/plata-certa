import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DisplayMode = 'standard' | 'accessible';
export type GardenerLevel = 'beginner' | 'casual' | 'experienced';

export type SettingsState = {
  mode: DisplayMode;
  hasOnboarded: boolean;
  gardenerLevel: GardenerLevel | null;
  notificationsEnabled: boolean;
  locale: 'pt-BR';
  /** Lê em voz alta os resultados (usado a partir da Fase 3). */
  speakResults: boolean;

  setMode: (mode: DisplayMode) => void;
  setHasOnboarded: (value: boolean) => void;
  setGardenerLevel: (level: GardenerLevel) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setSpeakResults: (value: boolean) => void;
  resetOnboarding: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: 'standard',
      hasOnboarded: false,
      gardenerLevel: null,
      notificationsEnabled: true,
      locale: 'pt-BR',
      speakResults: false,

      setMode: (mode) => set({ mode }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setGardenerLevel: (gardenerLevel) => set({ gardenerLevel }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSpeakResults: (speakResults) => set({ speakResults }),
      resetOnboarding: () =>
        set({ hasOnboarded: false, gardenerLevel: null, mode: 'standard' }),
    }),
    {
      name: 'plantacerta:settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Hook que retorna `true` quando o estado persistido já foi rehidratado
 * do AsyncStorage. Em SSR (sem `window`), retorna `true` imediatamente
 * para não bloquear o render — o cliente refaz com o estado correto.
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    () => typeof window === 'undefined' || useSettingsStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;

    const unsubFinish = useSettingsStore.persist.onFinishHydration(() => setHydrated(true));
    // Caso a hidratação tenha terminado entre a primeira render e o efeito.
    if (useSettingsStore.persist.hasHydrated()) setHydrated(true);

    return () => {
      unsubFinish();
    };
  }, [hydrated]);

  return hydrated;
}

/**
 * Multiplicador de tamanho de fonte. Modo acessível aumenta 30%
 * conforme spec.
 */
export function useFontScale(): number {
  return useSettingsStore((s) => (s.mode === 'accessible' ? 1.3 : 1));
}

/**
 * Altura mínima de toque. Modo acessível aumenta de 48 → 56dp para
 * reduzir cliques errados.
 */
export function useTouchTarget(): number {
  return useSettingsStore((s) => (s.mode === 'accessible' ? 56 : 48));
}
