import { Direction, Role } from '../../common/enums/reference.enum';

/**
 * Парсер baseline-файла «Шаблон плановой оценки.xlsx».
 *
 * Раскладка (0-based индексы колонок), шапка из 3 строк, данные с 4-й строки:
 *   A(0) № п/п | B(1) подсистема (skip) | C(2) название | D(3) описание
 *   E(4) Ключ Epic | F(5) Оценки (всего)
 *   далее колонки часов по направлениям/ролям (см. COLUMN_MAP).
 *   Колонки «Ревью» (J=9, M=12, O=14) — не заносятся.
 *   Риск-часы суммируются с обычной оценкой.
 * См. architecture.md → «Маппинг входных файлов».
 */

const COL = {
  number: 0, // A
  title: 2, // C
  description: 3, // D
  epicKey: 4, // E
  total: 5, // F
};

/** Пара направление/роль → колонки файла, которые в неё суммируются. */
interface HoursColumn {
  direction: Direction;
  role: Role;
  cols: number[];
}

const COLUMN_MAP: HoursColumn[] = [
  { direction: Direction.TEAMLEAD, role: Role.TEAMLEAD, cols: [6] }, // G
  { direction: Direction.ANALYTICS, role: Role.ANALYST, cols: [7, 10] }, // H + K
  { direction: Direction.ANALYTICS, role: Role.TECHWRITER, cols: [8, 11, 13] }, // I + L + N (Документация)
  { direction: Direction.DESIGN, role: Role.DESIGNER, cols: [15, 16] }, // P + Q
  { direction: Direction.FRONTEND, role: Role.FRONTEND_DEV, cols: [17, 18] }, // R + S
  { direction: Direction.BACKEND, role: Role.BACKEND_DEV, cols: [19, 20] }, // T + U
  { direction: Direction.QA, role: Role.QA, cols: [21, 22] }, // V + W (Тест-кейс + QA)
  { direction: Direction.DEVOPS, role: Role.DEVOPS, cols: [23, 24] }, // X + Y
];

export interface ParsedHours {
  direction: Direction;
  role: Role;
  plannedHours: number;
}

export interface ParsedEstimateTask {
  externalNumber: string | null;
  title: string;
  description: string | null;
  externalEpicKey: string | null;
  declaredHours: number | null;
  totalHours: number;
  hours: ParsedHours[];
}

export interface ParsedBaseline {
  tasks: ParsedEstimateTask[];
  totalHours: number;
  declaredTotalHours: number | null;
  warnings: string[];
}

const EPS = 0.01;

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const n = parseFloat(String(v).replace(',', '.').replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
}

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

/** Парсит буфер Excel в нормализованный baseline. */
export function parseBaselineBuffer(buffer: Buffer): ParsedBaseline {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const xlsx = require('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: unknown[][] = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  const warnings: string[] = [];

  // Поиск строки шапки «№ п/п» — данные начинаются на 3 строки ниже (шапка 3-уровневая).
  let headerIdx = grid.findIndex((row) => toStr(row?.[COL.number]) === '№ п/п');
  if (headerIdx === -1) {
    headerIdx = 0;
    warnings.push('Шапка «№ п/п» не распознана — используется стандартная раскладка с 4-й строки.');
  }
  const dataStart = headerIdx + 3;

  const tasks: ParsedEstimateTask[] = [];
  let declaredTotalHours: number | null = null;

  for (let i = dataStart; i < grid.length; i++) {
    const row = grid[i] ?? [];
    const numCell = toStr(row[COL.number]);
    const title = toStr(row[COL.title]);

    // Строка «ИТОГО» — контрольная сумма проекта, не задача оценки.
    if (/ИТОГО/i.test(numCell) || /ИТОГО/i.test(title)) {
      declaredTotalHours = toNum(row[COL.total]) || declaredTotalHours;
      continue;
    }

    // Служебные/пустые строки без названия — пропускаем (FR-03).
    if (!title) continue;

    const hours: ParsedHours[] = [];
    let computed = 0;
    for (const m of COLUMN_MAP) {
      const sum = m.cols.reduce((acc, c) => acc + toNum(row[c]), 0);
      if (sum > 0) {
        hours.push({ direction: m.direction, role: m.role, plannedHours: sum });
        computed += sum;
      }
    }

    // Строки только со служебными данными / итог без часов (FR-03) — не создают задачу.
    if (computed === 0) continue;

    const declared = toNum(row[COL.total]);
    if (declared > 0 && Math.abs(declared - computed) > EPS) {
      warnings.push(
        `Задача «${title}»: сумма по ролям (${computed}) не совпадает с колонкой «Оценки» (${declared}).`,
      );
    }

    tasks.push({
      externalNumber: numCell || null,
      title,
      description: toStr(row[COL.description]) || null,
      externalEpicKey: toStr(row[COL.epicKey]) || null,
      declaredHours: declared || null,
      totalHours: computed,
      hours,
    });
  }

  if (tasks.length === 0) {
    warnings.push('Не найдено ни одной задачи оценки — проверьте структуру файла.');
  }

  const totalHours = tasks.reduce((s, t) => s + t.totalHours, 0);
  if (declaredTotalHours !== null && Math.abs(declaredTotalHours - totalHours) > EPS) {
    warnings.push(
      `Контрольная сумма «ИТОГО» (${declaredTotalHours}) не совпадает с суммой задач оценки (${totalHours}).`,
    );
  }

  return { tasks, totalHours, declaredTotalHours, warnings };
}
