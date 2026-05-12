import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nextWateringFromNow } from '@/lib/wateringStatus';
import {
  cancelPlantWatering,
  requestNotificationPermission,
  schedulePlantWatering,
} from '@/services/notifications';
import type {
  CareAction,
  CareLogEntry,
  PlantIdentification,
  SavedPlant,
} from '@/types/plant';

/**
 * Plantas do usuário (Meu Jardim). Persistido via Zustand persist +
 * AsyncStorage. No mobile, AsyncStorage é uma camada sobre SQLite
 * (no Android) e arquivos JSON (no iOS); no web é localStorage. Pra
 * o tamanho que o jardim de um usuário tem (raramente +100 plantas),
 * é simples, rápido e suficiente.
 *
 * Quando precisarmos de queries complexas (estatísticas, gráficos), aí
 * sim vale migrar pra `expo-sqlite` direto.
 */

type State = {
  plants: SavedPlant[];

  /** Adiciona uma planta ao jardim. Retorna o ID gerado. */
  addPlant: (input: {
    identification: PlantIdentification;
    photoUri: string;
    nickname: string;
  }) => string;

  removePlant: (id: string) => void;

  updateNickname: (id: string, nickname: string) => void;

  /** Marca uma ação de cuidado e atualiza o cronograma de rega se for o caso. */
  logCare: (id: string, action: CareAction, opts?: { note?: string; photoUri?: string }) => void;

  /** Adiciona uma foto à galeria + entrada no log com action='photo'. */
  addPhoto: (id: string, uri: string) => void;

  /** Útil em desenvolvimento. */
  clear: () => void;
};

export const useGardenStore = create<State>()(
  persist(
    (set, get) => ({
      plants: [],

      addPlant: ({ identification, photoUri, nickname }) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        const next = nextWateringFromNow(identification.care.waterFrequencyDays);
        const finalNickname = nickname.trim() || identification.commonName;
        const plant: SavedPlant = {
          id,
          nickname: finalNickname,
          photoUri,
          photos: [photoUri],
          identification,
          addedAt: now,
          lastWateredAt: null,
          nextWateringAt: next,
          careLog: [],
          wateringNotificationId: null,
        };
        set({ plants: [plant, ...get().plants] });

        // Agenda lembrete em background. Pede permissão se for a primeira
        // planta — falhas (negação, sem rede no caso do web) não bloqueiam
        // o salvamento.
        (async () => {
          const granted = await requestNotificationPermission();
          if (!granted) return;
          const notifId = await schedulePlantWatering(finalNickname, new Date(next));
          if (notifId) {
            set({
              plants: get().plants.map((p) =>
                p.id === id ? { ...p, wateringNotificationId: notifId } : p,
              ),
            });
          }
        })();

        return id;
      },

      removePlant: (id) => {
        const plant = get().plants.find((p) => p.id === id);
        if (plant?.wateringNotificationId) {
          cancelPlantWatering(plant.wateringNotificationId).catch(() => {});
        }
        set({ plants: get().plants.filter((p) => p.id !== id) });
      },

      updateNickname: (id, nickname) => {
        set({
          plants: get().plants.map((p) =>
            p.id === id ? { ...p, nickname: nickname.trim() || p.nickname } : p,
          ),
        });
      },

      logCare: (id, action, opts) => {
        const before = get().plants.find((p) => p.id === id);
        set({
          plants: get().plants.map((p) => {
            if (p.id !== id) return p;
            const entry: CareLogEntry = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              action,
              at: new Date().toISOString(),
              note: opts?.note,
              photoUri: opts?.photoUri,
            };
            const updated: SavedPlant = {
              ...p,
              careLog: [entry, ...p.careLog],
            };
            // Atualiza cronograma quando a ação for rega.
            if (action === 'watered') {
              updated.lastWateredAt = entry.at;
              updated.nextWateringAt = nextWateringFromNow(
                p.identification.care.waterFrequencyDays,
              );
            }
            return updated;
          }),
        });

        // Reagenda a notificação quando o usuário regou.
        if (action === 'watered' && before) {
          (async () => {
            await cancelPlantWatering(before.wateringNotificationId);
            const updated = get().plants.find((p) => p.id === id);
            if (!updated?.nextWateringAt) return;
            const notifId = await schedulePlantWatering(
              updated.nickname,
              new Date(updated.nextWateringAt),
            );
            set({
              plants: get().plants.map((p) =>
                p.id === id ? { ...p, wateringNotificationId: notifId } : p,
              ),
            });
          })().catch((err) => console.warn('[garden] reschedule failed:', err));
        }
      },

      addPhoto: (id, uri) => {
        set({
          plants: get().plants.map((p) => {
            if (p.id !== id) return p;
            const entry: CareLogEntry = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              action: 'photo',
              at: new Date().toISOString(),
              photoUri: uri,
            };
            return {
              ...p,
              photos: [uri, ...p.photos],
              careLog: [entry, ...p.careLog],
            };
          }),
        });
      },

      clear: () => set({ plants: [] }),
    }),
    {
      name: 'plantacerta:garden',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Hook seletor — uma planta por id. Retorna undefined se não existe. */
export function useSavedPlant(id: string | undefined): SavedPlant | undefined {
  return useGardenStore((s) => s.plants.find((p) => p.id === id));
}
