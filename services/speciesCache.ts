import AsyncStorage from '@react-native-async-storage/async-storage';

import { SEED_SPECIES } from '@/assets/mocks/seed-cache';
import type { PlantIdentification } from '@/types/plant';

/**
 * Cache de identificações por nome científico. Camada 2 da arquitetura B:
 * a primeira chamada do Claude descobre a espécie; se ela já está aqui,
 * pulamos a chamada cara que gera o guia de cuidados.
 *
 * Backend atual: AsyncStorage (per-device). Em produção, mover para um
 * Supabase compartilhado entre usuários — a interface deste módulo já
 * está pronta pra essa troca, basta substituir as funções `read`/`write`.
 *
 * TTL longo de propósito: o guia de cuidados de uma espécie quase não
 * muda. 1 ano dá tempo de a base ser refinada com revisões pontuais.
 */

const KEY_PREFIX = 'plantacerta:species:';
const SEEDED_FLAG_KEY = 'plantacerta:seeded';
const TTL_MS = 365 * 24 * 60 * 60 * 1000;

type Entry = {
  identification: PlantIdentification;
  /** Timestamp em ms da escrita. */
  cachedAt: number;
};

/**
 * Normaliza o nome científico pra lookup consistente. "Monstera Deliciosa "
 * vira "monstera deliciosa". Sem isso, capitalização ou espaços extras
 * causariam cache miss desnecessário.
 */
export function normalizeScientificName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function keyFor(scientificName: string): string {
  return KEY_PREFIX + normalizeScientificName(scientificName);
}

export async function getCached(
  scientificName: string,
): Promise<PlantIdentification | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(scientificName));
    if (!raw) return null;
    const entry: Entry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > TTL_MS) {
      // Expirou — remove silenciosamente e devolve miss.
      AsyncStorage.removeItem(keyFor(scientificName)).catch(() => {});
      return null;
    }
    return entry.identification;
  } catch (err) {
    console.warn('[speciesCache] read failed:', err);
    return null;
  }
}

export async function setCached(identification: PlantIdentification): Promise<void> {
  if (!identification.scientificName) return;
  try {
    const entry: Entry = { identification, cachedAt: Date.now() };
    await AsyncStorage.setItem(
      keyFor(identification.scientificName),
      JSON.stringify(entry),
    );
  } catch (err) {
    console.warn('[speciesCache] write failed:', err);
  }
}

/**
 * Popula o cache com o bundle de espécies populares na primeira execução.
 * Idempotente: marca uma flag em AsyncStorage pra não reescrever a cada
 * abertura. Quando trocarmos o bundle (versão nova de seeds), incremente
 * `SEED_VERSION` em seed-cache.ts pra forçar re-seed.
 */
export async function seedCacheIfNeeded(seedVersion: number): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(SEEDED_FLAG_KEY);
    if (flag === String(seedVersion)) return;

    await Promise.all(
      SEED_SPECIES.map((id) =>
        AsyncStorage.setItem(
          keyFor(id.scientificName),
          JSON.stringify({ identification: id, cachedAt: Date.now() } satisfies Entry),
        ),
      ),
    );
    await AsyncStorage.setItem(SEEDED_FLAG_KEY, String(seedVersion));
  } catch (err) {
    console.warn('[speciesCache] seed failed:', err);
  }
}

/**
 * Limpa todas as entradas de espécie do cache. Útil em desenvolvimento
 * e na opção "Refazer onboarding". Não toca em outras chaves.
 */
export async function clearSpeciesCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(KEY_PREFIX) || k === SEEDED_FLAG_KEY);
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch (err) {
    console.warn('[speciesCache] clear failed:', err);
  }
}
