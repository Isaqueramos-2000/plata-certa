import { afterEach, describe, expect, it } from 'vitest';

import {
  clearSpeciesCache,
  getCached,
  normalizeScientificName,
  setCached,
} from '@/services/speciesCache';
import type { PlantIdentification } from '@/types/plant';

afterEach(async () => {
  await clearSpeciesCache();
});

function makeIdentification(name: string): PlantIdentification {
  return {
    identified: true,
    confidence: 'high',
    commonName: 'Costela-de-adão',
    scientificName: name,
    family: 'Araceae',
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
  };
}

describe('normalizeScientificName', () => {
  it('lowercase + trim', () => {
    expect(normalizeScientificName('  Monstera Deliciosa  ')).toBe('monstera deliciosa');
  });

  it('colapsa múltiplos espaços em um só', () => {
    expect(normalizeScientificName('Monstera   deliciosa')).toBe('monstera deliciosa');
  });
});

describe('cache get/set', () => {
  it('escreve e lê de volta a mesma identificação', async () => {
    const id = makeIdentification('Monstera deliciosa');
    await setCached(id);
    const out = await getCached('Monstera deliciosa');
    expect(out?.scientificName).toBe('Monstera deliciosa');
  });

  it('hit case-insensitive na busca (graças à normalização)', async () => {
    const id = makeIdentification('Monstera deliciosa');
    await setCached(id);
    const out = await getCached('  MONSTERA DELICIOSA  ');
    expect(out).not.toBeNull();
    expect(out?.scientificName).toBe('Monstera deliciosa');
  });

  it('miss em espécie ainda não escrita', async () => {
    const out = await getCached('Especie inexistente');
    expect(out).toBeNull();
  });

  it('clearSpeciesCache remove tudo', async () => {
    await setCached(makeIdentification('Monstera deliciosa'));
    await setCached(makeIdentification('Crassula ovata'));
    await clearSpeciesCache();
    expect(await getCached('Monstera deliciosa')).toBeNull();
    expect(await getCached('Crassula ovata')).toBeNull();
  });
});
