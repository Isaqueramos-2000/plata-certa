import type { SavedPlant } from '@/types/plant';

const DAY_MS = 24 * 60 * 60 * 1000;

export type WateringStatus = {
  /** Texto curto pra mostrar no card e no detalhe. */
  label: string;
  /** Variante de cor pra Badge/UI: success (em dia), warning (logo), danger (atrasada). */
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  /** Dias até a próxima rega (negativo se atrasada, 0 se hoje). null se nunca regada. */
  daysUntil: number | null;
};

/**
 * Calcula o estado de rega de uma planta. Tudo em dias inteiros pra
 * que o usuário veja "em 2 dias" e não "em 1.7 dias".
 */
export function computeWateringStatus(plant: SavedPlant): WateringStatus {
  if (!plant.nextWateringAt) {
    return { label: 'Regar logo', tone: 'warning', daysUntil: 0 };
  }
  const now = Date.now();
  const next = new Date(plant.nextWateringAt).getTime();
  const diffDays = Math.ceil((next - now) / DAY_MS);

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      label: overdue === 1 ? 'Atrasada 1 dia' : `Atrasada ${overdue} dias`,
      tone: 'danger',
      daysUntil: diffDays,
    };
  }
  if (diffDays === 0) {
    return { label: 'Regar hoje', tone: 'warning', daysUntil: 0 };
  }
  if (diffDays === 1) {
    return { label: 'Regar amanhã', tone: 'warning', daysUntil: 1 };
  }
  if (diffDays <= 3) {
    return { label: `Regar em ${diffDays} dias`, tone: 'neutral', daysUntil: diffDays };
  }
  return { label: `Em dia (${diffDays} dias)`, tone: 'success', daysUntil: diffDays };
}

/**
 * Calcula o `nextWateringAt` a partir de agora e da frequência da espécie.
 * Usado quando o usuário marca "Reguei agora".
 */
export function nextWateringFromNow(waterFrequencyDays: number): string {
  const days = Math.max(1, Math.round(waterFrequencyDays));
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

const PT_MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/**
 * Data absoluta compacta em pt-BR: "Hoje 14:30", "Ontem 09:15",
 * "5 mai 23:14" ou "5 mai 2024" (se o ano for diferente). Usado no
 * histórico de cuidados pra dar uma referência exata sem ocupar
 * muito espaço.
 */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return `Hoje ${time}`;
  if (isYesterday) return `Ontem ${time}`;

  const day = d.getDate();
  const month = PT_MONTHS_SHORT[d.getMonth()];
  if (d.getFullYear() === now.getFullYear()) return `${day} ${month} ${time}`;
  return `${day} ${month} ${d.getFullYear()}`;
}

/** Formata uma data ISO num "há X tempo" simples em pt-BR. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return 'agora';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? 'ontem' : `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}
