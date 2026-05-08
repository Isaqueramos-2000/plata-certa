import { MOCK_IDENTIFICATIONS } from './identifications';
import type { PlantIdentification } from '@/types/plant';

/**
 * Espécies bundladas pra pré-popular o cache do usuário no primeiro
 * lançamento. A lógica de aplicação está em services/speciesCache.ts.
 *
 * Pra produção, este array deve crescer pra ~100 espécies populares no
 * Brasil (Costela-de-adão, Espada-de-são-jorge, Suculentas, Samambaias,
 * Jiboia, Dólar, Zamioculca, Lírio-da-paz, Antúrio, etc.). Cada entrada
 * pode ser gerada uma vez offline pelo Claude e versionada aqui.
 *
 * Quando trocarmos o conteúdo, incremente `SEED_VERSION` pra forçar
 * re-seed em apps que já estão instalados.
 */
export const SEED_VERSION = 1;

export const SEED_SPECIES: PlantIdentification[] = MOCK_IDENTIFICATIONS;
