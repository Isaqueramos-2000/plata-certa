import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  computeWateringStatus,
  formatDateShort,
  nextWateringFromNow,
  relativeTime,
} from '@/lib/wateringStatus';
import type { SavedPlant } from '@/types/plant';

const FIXED_NOW = new Date('2026-05-04T14:30:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makePlant(overrides: Partial<SavedPlant>): SavedPlant {
  return {
    id: 'p1',
    nickname: 'Test',
    photoUri: '',
    photos: [],
    identification: {
      identified: true,
      confidence: 'high',
      commonName: 'Test',
      scientificName: 'Testus testus',
      family: 'Testaceae',
      description: '',
      care: {
        light: '',
        water: '',
        waterFrequencyDays: 5,
        soil: '',
        temperature: '',
        humidity: '',
        fertilizer: '',
      },
      calendar: { pruning: '', repotting: '', fertilizing: '' },
      commonProblems: [],
      funFacts: [],
      difficulty: 'fácil',
    },
    addedAt: new Date(FIXED_NOW).toISOString(),
    lastWateredAt: null,
    nextWateringAt: null,
    careLog: [],
    wateringNotificationId: null,
    ...overrides,
  };
}

describe('computeWateringStatus', () => {
  it('retorna "Regar logo" quando nextWateringAt é null', () => {
    const status = computeWateringStatus(makePlant({}));
    expect(status.tone).toBe('warning');
    expect(status.label).toMatch(/Regar logo/);
  });

  it('retorna "Regar hoje" quando próxima rega é exatamente agora', () => {
    const status = computeWateringStatus(
      makePlant({ nextWateringAt: new Date(FIXED_NOW).toISOString() }),
    );
    expect(status.daysUntil).toBe(0);
    expect(status.label).toBe('Regar hoje');
  });

  it('retorna "Regar amanhã" quando faltam 24h', () => {
    const status = computeWateringStatus(
      makePlant({ nextWateringAt: new Date(FIXED_NOW + 24 * 60 * 60 * 1000).toISOString() }),
    );
    expect(status.label).toBe('Regar amanhã');
    expect(status.daysUntil).toBe(1);
  });

  it('marca como "Em dia" quando faltam mais de 3 dias', () => {
    const status = computeWateringStatus(
      makePlant({ nextWateringAt: new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000).toISOString() }),
    );
    expect(status.tone).toBe('success');
    expect(status.label).toMatch(/Em dia/);
  });

  it('marca como atrasada com pluralização correta', () => {
    const status1 = computeWateringStatus(
      makePlant({ nextWateringAt: new Date(FIXED_NOW - 1 * 24 * 60 * 60 * 1000).toISOString() }),
    );
    expect(status1.label).toBe('Atrasada 1 dia');
    expect(status1.tone).toBe('danger');

    const status3 = computeWateringStatus(
      makePlant({ nextWateringAt: new Date(FIXED_NOW - 3 * 24 * 60 * 60 * 1000).toISOString() }),
    );
    expect(status3.label).toBe('Atrasada 3 dias');
    expect(status3.tone).toBe('danger');
  });
});

describe('nextWateringFromNow', () => {
  it('respeita a frequência em dias', () => {
    const iso = nextWateringFromNow(7);
    const expected = new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(iso).toBe(expected);
  });

  it('arredonda valores fracionários e força mínimo de 1 dia', () => {
    const iso = nextWateringFromNow(0);
    const expected = new Date(FIXED_NOW + 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(iso).toBe(expected);
  });
});

describe('relativeTime', () => {
  it('"agora" pra timestamps muito recentes', () => {
    expect(relativeTime(new Date(FIXED_NOW - 30_000).toISOString())).toBe('agora');
  });

  it('minutos pra menos de 1h', () => {
    expect(relativeTime(new Date(FIXED_NOW - 5 * 60_000).toISOString())).toBe('há 5 min');
  });

  it('horas pra menos de 1 dia', () => {
    expect(relativeTime(new Date(FIXED_NOW - 2 * 60 * 60_000).toISOString())).toBe('há 2 h');
  });

  it('"ontem" pra 1 dia atrás', () => {
    expect(relativeTime(new Date(FIXED_NOW - 24 * 60 * 60_000).toISOString())).toBe('ontem');
  });
});

describe('formatDateShort', () => {
  it('"Hoje HH:MM" pra hoje', () => {
    // Trabalhamos em UTC nos asserts. O teste é tolerante a fuso, só
    // garante que o prefixo é "Hoje".
    const out = formatDateShort(new Date(FIXED_NOW - 60_000).toISOString());
    expect(out).toMatch(/^Hoje \d{2}:\d{2}$/);
  });

  it('"Ontem HH:MM" pra ontem', () => {
    const yesterday = new Date(FIXED_NOW);
    yesterday.setDate(yesterday.getDate() - 1);
    const out = formatDateShort(yesterday.toISOString());
    expect(out).toMatch(/^Ontem \d{2}:\d{2}$/);
  });

  it('inclui mês abreviado em pt-BR pra datas antigas do mesmo ano', () => {
    const old = new Date(FIXED_NOW);
    old.setMonth(old.getMonth() - 2);
    const out = formatDateShort(old.toISOString());
    expect(out).toMatch(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/);
  });
});
