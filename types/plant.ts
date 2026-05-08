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
  /** Histórico de Q&A com a IA sobre essa planta. */
  chatHistory: ChatMessage[];
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

/**
 * Mensagem em uma conversa de Q&A sobre uma planta. Persistida por
 * planta no gardenStore (Fase 5); na result.tsx a conversa fica em
 * memória local até o usuário salvar a planta.
 */
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** ISO timestamp de criação. */
  createdAt: string;
};
