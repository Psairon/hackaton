/**
 * Индикаторы риска (FR-19). Пороги в MVP фиксированы.
 * Цвета: green / yellow / red / grey. У каждого риска — явная причина.
 */

export enum RiskLevel {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
  GREY = 'grey',
}

export interface RiskInput {
  baselineHours: number;
  actualHours: number;
  dueDate?: string | null;
  refDate?: Date;
  /** Неполные данные / несвязанный элемент → серый (FR-12). */
  incomplete?: boolean;
  incompleteReason?: string;
}

export interface RiskResult {
  level: RiskLevel;
  usagePercent: number | null;
  reasons: string[];
}

const YELLOW_THRESHOLD = 80; // % использования baseline (раннее предупреждение для PM/TL)
const NEAR_DUE_MS = 24 * 60 * 60 * 1000; // < 1 дня

export function computeRisk(input: RiskInput): RiskResult {
  const { baselineHours, actualHours, dueDate, incomplete, incompleteReason } = input;
  const refDate = input.refDate ?? new Date();
  const reasons: string[] = [];

  if (incomplete) {
    return {
      level: RiskLevel.GREY,
      usagePercent: null,
      reasons: [incompleteReason ?? 'Неполные данные'],
    };
  }

  const usagePercent =
    baselineHours > 0
      ? (actualHours / baselineHours) * 100
      : actualHours > 0
        ? Infinity
        : 0;

  let overdue = false;
  let nearDue = false;
  if (dueDate) {
    const due = new Date(dueDate).getTime();
    if (!isNaN(due)) {
      const diff = due - refDate.getTime();
      overdue = diff < 0;
      nearDue = diff >= 0 && diff < NEAR_DUE_MS;
    }
  }

  if (usagePercent > 100) reasons.push('Превышение факта над baseline');
  if (overdue) reasons.push('Просрочен срок');
  if (reasons.length) {
    return { level: RiskLevel.RED, usagePercent: finite(usagePercent), reasons };
  }

  if (usagePercent >= YELLOW_THRESHOLD) reasons.push('Приближение факта к baseline');
  if (nearDue) reasons.push('Близкий срок (< 1 дня)');
  if (reasons.length) {
    return { level: RiskLevel.YELLOW, usagePercent: finite(usagePercent), reasons };
  }

  return { level: RiskLevel.GREEN, usagePercent: finite(usagePercent), reasons: [] };
}

function finite(n: number): number | null {
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
