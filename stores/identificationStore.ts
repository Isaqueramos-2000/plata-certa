import { create } from 'zustand';

import type { IdentifySource } from '@/services/plantAI';
import type { PlantIdentification } from '@/types/plant';

/**
 * Store transitória usada pra passar o resultado da identificação da
 * tela de captura pra tela de resultado. Não persistida — se o usuário
 * fechar e abrir o app, o resultado some (e tudo bem; ele pode tirar
 * outra foto).
 *
 * Por que não passar via search params? O `PlantIdentification` tem
 * objetos aninhados; serializar tudo na URL fica feio e tem limites
 * de tamanho. Store é o caminho mais simples e tipado.
 */

export type CurrentIdentification = {
  uri: string;
  identification: PlantIdentification;
  source: IdentifySource;
};

type IdentificationState = {
  current: CurrentIdentification | null;
  set: (value: CurrentIdentification) => void;
  clear: () => void;
};

export const useIdentificationStore = create<IdentificationState>((set) => ({
  current: null,
  set: (value) => set({ current: value }),
  clear: () => set({ current: null }),
}));
