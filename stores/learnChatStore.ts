import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ChatMessage } from '@/types/plant';

/**
 * Histórico da conversa geral na aba Aprender (sem planta de referência).
 * Compartilha o contador de perguntas (questionsStore) com o Q&A
 * por planta — ambos consomem do mesmo limite de 10/usuário.
 *
 * Persistido pra que o usuário consiga voltar e ler perguntas antigas.
 */

type State = {
  history: ChatMessage[];
  append: (question: ChatMessage, answer: ChatMessage) => void;
  clear: () => void;
};

export const useLearnChatStore = create<State>()(
  persist(
    (set) => ({
      history: [],
      append: (question, answer) =>
        set((s) => ({ history: [...s.history, question, answer] })),
      clear: () => set({ history: [] }),
    }),
    {
      name: 'plantacerta:learnChat',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
