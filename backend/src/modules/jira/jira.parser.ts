import { BadRequestException } from '@nestjs/common';

/**
 * Парсеры Jira-выгрузки (FR-06–09).
 * Файл 1 — структура задач (Advanced Roadmaps RoadMap): Поставка → Epic → Задача.
 * Файл 2 — трудозатраты (worklog).
 * См. architecture.md → «Маппинг входных файлов» и ТЗ Jira-импорта.
 */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/** «30/Mar/26» или Excel-serial → ISO `YYYY-MM-DD`. null, если не распознано. */
export function parseJiraDate(v: unknown): string | null {
  const s = toStr(v);
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3})[\/\-\s](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (mon) {
      return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  // Excel serial date
  const serial = Number(s);
  if (!isNaN(serial) && serial > 20000 && serial < 90000) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

interface Sheet {
  header: Record<string, number>;
  rows: unknown[][];
}

function loadSheet(buffer: Buffer, sheetIndex = 0): Sheet {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const xlsx = require('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
  const grid: unknown[][] = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });
  const header: Record<string, number> = {};
  (grid[0] ?? []).forEach((h, i) => {
    const key = toStr(h);
    if (key && !(key in header)) header[key] = i;
  });
  return { header, rows: grid.slice(1) };
}

function assertColumns(header: Record<string, number>, required: string[], file: string) {
  const missing = required.filter((c) => !(c in header));
  if (missing.length) {
    throw new BadRequestException(
      `${file}: отсутствуют обязательные колонки: ${missing.join(', ')}`,
    );
  }
}

// ---------- Файл 1: структура ----------

export interface ParsedDelivery {
  key: string;
  name: string;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
}
export interface ParsedEpic {
  key: string;
  name: string;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
}
export interface ParsedStructTask {
  key: string;
  name: string;
  taskType: string | null;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  assigneeRaw: string | null; // «Исполнитель» (ФИО) из файла структуры
  epicKey: string | null;
  epicName: string;
}
export interface ParsedStructure {
  delivery: ParsedDelivery;
  epics: ParsedEpic[];
  tasks: ParsedStructTask[];
  warnings: string[];
}

const F1_REQUIRED = [
  'Иерархия', 'Название', 'Ключ задачи', 'Статус задачи', 'Приоритет', 'Родительская задача',
];

/** Срок: «Целевая дата окончания» → «Срок выполнения» → null. */
function resolveDue(get: (k: string) => unknown): string | null {
  return parseJiraDate(get('Целевая дата окончания')) ?? parseJiraDate(get('Срок выполнения'));
}

export function parseStructureFile(buffer: Buffer, deliveryKey: string): ParsedStructure {
  const { header, rows } = loadSheet(buffer, 0);
  assertColumns(header, F1_REQUIRED, 'Файл структуры');
  const col = (row: unknown[], name: string) =>
    name in header ? row[header[name]] : null;
  const warnings: string[] = [];

  // 1. Поставка
  const dRow = rows.find(
    (r) => toStr(col(r, 'Иерархия')) === 'Поставка' && toStr(col(r, 'Ключ задачи')) === deliveryKey,
  );
  if (!dRow) {
    throw new BadRequestException(`Поставка с ключом «${deliveryKey}» не найдена в файле структуры`);
  }
  const dGet = (k: string) => col(dRow, k);
  const delivery: ParsedDelivery = {
    key: deliveryKey,
    name: toStr(dGet('Название')),
    status: toStr(dGet('Статус задачи')) || null,
    priority: toStr(dGet('Приоритет')) || null,
    dueDate: resolveDue(dGet),
  };

  // 2. Эпики (Родительская задача == имя поставки)
  const epics: ParsedEpic[] = [];
  const epicKeyByName = new Map<string, string>();
  for (const r of rows) {
    if (toStr(col(r, 'Иерархия')) !== 'Epic') continue;
    if (toStr(col(r, 'Родительская задача')) !== delivery.name) continue;
    const get = (k: string) => col(r, k);
    const name = toStr(get('Название'));
    const key = toStr(get('Ключ задачи'));
    epics.push({
      key,
      name,
      status: toStr(get('Статус задачи')) || null,
      priority: toStr(get('Приоритет')) || null,
      dueDate: resolveDue(get),
    });
    if (name) epicKeyByName.set(name, key);
  }
  if (epics.length === 0) warnings.push('У поставки не найдено ни одного эпика.');

  // 3. Задачи (Родительская задача == имя эпика)
  const epicNames = new Set(epics.map((e) => e.name));
  const tasks: ParsedStructTask[] = [];
  for (const r of rows) {
    const hierarchy = toStr(col(r, 'Иерархия'));
    if (hierarchy === 'Epic' || hierarchy === 'Поставка') continue;
    const epicName = toStr(col(r, 'Родительская задача'));
    if (!epicNames.has(epicName)) continue;
    const get = (k: string) => col(r, k);
    tasks.push({
      key: toStr(get('Ключ задачи')),
      name: toStr(get('Название')),
      taskType: hierarchy || null, // «Иерархия» у задач = тип (Задача бэкенда, Ошибка …)
      status: toStr(get('Статус задачи')) || null,
      priority: toStr(get('Приоритет')) || null,
      dueDate: resolveDue(get),
      assigneeRaw: toStr(get('Исполнитель')) || null,
      epicKey: epicKeyByName.get(epicName) ?? null,
      epicName,
    });
  }

  return { delivery, epics, tasks, warnings };
}

// ---------- Файл 2: трудозатраты ----------

export interface ParsedWorklog {
  taskKey: string;
  taskName: string | null;
  hours: number;
  assigneeLogin: string | null; // «Имя пользователя» — основной ключ матчинга
  assigneeRaw: string | null; // «Полное имя» (с пометками [X])
  taskType: string | null;
  epicLink: string | null; // «Ссылка на эпик» (имя эпика) — fallback
  parentKey: string | null;
  workDate: string | null;
}

const F2_REQUIRED = [
  'Ключ задачи', 'Часов', 'Полное имя', 'Тип задачи', 'Ключ родителя', 'Ссылка на эпик',
];

export function parseWorklogFile(buffer: Buffer): { worklogs: ParsedWorklog[] } {
  const { header, rows } = loadSheet(buffer, 0);
  assertColumns(header, F2_REQUIRED, 'Файл трудозатрат');
  const col = (row: unknown[], name: string) =>
    name in header ? row[header[name]] : null;

  const worklogs: ParsedWorklog[] = [];
  for (const r of rows) {
    const taskKey = toStr(col(r, 'Ключ задачи'));
    if (!taskKey) continue;
    worklogs.push({
      taskKey,
      taskName: toStr(col(r, 'Тема задачи')) || null, // в файле колонка «Тема задачи»
      hours: num(col(r, 'Часов')),
      assigneeLogin: toStr(col(r, 'Имя пользователя')) || null,
      assigneeRaw: toStr(col(r, 'Полное имя')) || null,
      taskType: toStr(col(r, 'Тип задачи')) || null,
      epicLink: toStr(col(r, 'Ссылка на эпик')) || null,
      parentKey: toStr(col(r, 'Ключ родителя')) || null,
      workDate: parseJiraDate(col(r, 'Дата работы')),
    });
  }
  return { worklogs };
}
