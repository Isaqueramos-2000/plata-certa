/**
 * Contratos da identificação retornada pelo Claude.
 * Mantenha em sincronia com o system prompt em services/plantAI.ts.
 */
export type Confidence = 'high' | 'medium' | 'low';
export type Difficulty = 'fácil' | 'médio' | 'difícil';

export type CareInfo = {
  light: string;
  water: string;
  /** Frequência sugerida em dias para alimentar o lembrete de rega. */
  waterFrequencyDays: number;
  soil: string;
  temperature: string;
  humidity: string;
  fertilizer: string;
};

export type CalendarInfo = {
  pruning: string;
  repotting: string;
  fertilizing: string;
};

export type CommonProblem = {
  problem: string;
  signs: string;
  solution: string;
};

export type PlantIdentification = {
  identified: boolean;
  confidence: Confidence;
  commonName: string;
  scientificName: string;
  family: string;
  description: string;
  care: CareInfo;
  calendar: CalendarInfo;
  commonProblems: CommonProblem[];
  funFacts: string[];
  difficulty: Difficulty;
};

/**
 * Planta salva no Meu Jardim. É a identificação + metadados pessoais
 * (apelido, foto local, histórico de cuidados).
 */
export type SavedPlant = {
  id: string;
  nickname: string;
  /** Foto principal (a primeira que o usuário tirou). */
  photoUri: string;
  /** Galeria de fotos extras adicionadas ao longo do tempo. */
  photos: string[];
  identification: PlantIdentification;
  addedAt: string; // ISO
  lastWateredAt: string | null;
  nextWateringAt: string | null;
  careLog: CareLogEntry[];
  /** ID do lembrete de rega agendado (expo-notifications). null se não há. */
  wateringNotificationId: string | null;
};

export type CareAction = 'watered' | 'fertilized' | 'pruned' | 'photo' | 'note';

export type CareLogEntry = {
  id: string;
  action: CareAction;
  at: string; // ISO
  note?: string;
  photoUri?: string;
};

