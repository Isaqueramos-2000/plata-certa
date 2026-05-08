import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGardenStore } from '@/stores/gardenStore';
import type { PlantIdentification } from '@/types/plant';

beforeEach(() => {
  useGardenStore.getState().clear();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeIdentification(): PlantIdentification {
  return {
    identified: true,
    confidence: 'high',
    commonName: 'Costela-de-adão',
    scientificName: 'Monstera deliciosa',
    family: 'Araceae',
    description: 'Planta tropical.',
    care: {
      light: 'Luz indireta.',
      water: 'A cada 5 dias.',
      waterFrequencyDays: 5,
      soil: 'Bem drenado.',
      temperature: '18-27°C.',
      humidity: 'Alta.',
      fertilizer: 'Mensal.',
    },
    calendar: { pruning: '', repotting: '', fertilizing: '' },
    commonProblems: [],
    funFacts: [],
    difficulty: 'fácil',
  };
}

describe('gardenStore.addPlant', () => {
  it('adiciona uma planta com apelido e gera ID', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'data:image/png;base64,abc',
      nickname: 'Adriana',
    });
    const plants = useGardenStore.getState().plants;
    expect(plants).toHaveLength(1);
    expect(plants[0]!.id).toBe(id);
    expect(plants[0]!.nickname).toBe('Adriana');
    expect(plants[0]!.photos).toContain('data:image/png;base64,abc');
  });

  it('usa o nome popular quando o apelido vier vazio', () => {
    useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: '   ',
    });
    expect(useGardenStore.getState().plants[0]!.nickname).toBe('Costela-de-adão');
  });

  it('inicializa nextWateringAt com base na frequência', () => {
    useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    const plant = useGardenStore.getState().plants[0]!;
    expect(plant.nextWateringAt).toBeTruthy();
    expect(plant.lastWateredAt).toBeNull();
  });
});

describe('gardenStore.logCare', () => {
  it('registra entrada no histórico', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    useGardenStore.getState().logCare(id, 'pruned');
    const plant = useGardenStore.getState().plants[0]!;
    expect(plant.careLog).toHaveLength(1);
    expect(plant.careLog[0]!.action).toBe('pruned');
  });

  it('atualiza lastWateredAt + nextWateringAt quando ação é watered', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T10:00:00Z'));
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    const before = useGardenStore.getState().plants[0]!.nextWateringAt;
    // Avança 1 dia pra simular que o usuário regou em outro momento.
    vi.setSystemTime(new Date('2026-05-05T10:00:00Z'));
    useGardenStore.getState().logCare(id, 'watered');
    const after = useGardenStore.getState().plants[0]!;
    expect(after.lastWateredAt).toBeTruthy();
    expect(after.nextWateringAt).not.toBe(before);
  });

  it('NÃO atualiza lastWateredAt quando ação é fertilized', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    useGardenStore.getState().logCare(id, 'fertilized');
    expect(useGardenStore.getState().plants[0]!.lastWateredAt).toBeNull();
  });
});

describe('gardenStore.removePlant', () => {
  it('remove pelo id', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    useGardenStore.getState().removePlant(id);
    expect(useGardenStore.getState().plants).toHaveLength(0);
  });
});

describe('gardenStore.addChatExchange', () => {
  it('persiste pergunta e resposta na ordem certa', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    const q = { id: 'q', role: 'user' as const, content: 'Como rego?', createdAt: '' };
    const a = { id: 'a', role: 'assistant' as const, content: 'A cada 5 dias.', createdAt: '' };
    useGardenStore.getState().addChatExchange(id, q, a);
    const chat = useGardenStore.getState().plants[0]!.chatHistory;
    expect(chat).toHaveLength(2);
    expect(chat[0]!.role).toBe('user');
    expect(chat[1]!.role).toBe('assistant');
  });
});

describe('gardenStore.updateNickname', () => {
  it('atualiza apelido', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    useGardenStore.getState().updateNickname(id, 'Bia');
    expect(useGardenStore.getState().plants[0]!.nickname).toBe('Bia');
  });

  it('mantém apelido antigo quando o novo vem vazio', () => {
    const id = useGardenStore.getState().addPlant({
      identification: makeIdentification(),
      photoUri: 'x',
      nickname: 'A',
    });
    useGardenStore.getState().updateNickname(id, '   ');
    expect(useGardenStore.getState().plants[0]!.nickname).toBe('A');
  });
});
