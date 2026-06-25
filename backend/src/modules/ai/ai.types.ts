/**
 * Контракт AI-сводки объекта контроля (FR-20, 21, 24, 25).
 * Ответ модели гарантируется OpenAI structured outputs (json_schema, strict).
 */

/** Допустимые управленческие действия (FR-24). */
export const ALLOWED_ACTIONS = [
  'уточнить остаток',
  'переоценить задачу/эпик',
  'перераспределить ресурс',
  'снизить scope',
  'пересогласовать срок',
  'эскалировать риск',
  'зафиксировать изменение объёма',
  'проверить связку данных',
] as const;

export interface AiSummaryModelOutput {
  state: string;
  mainRisks: { ref: string; title: string; level: 'red' | 'yellow' | 'grey'; text: string }[];
  questions: { ref: string; text: string }[];
  recommendations: { ref: string; action: string; text: string }[];
  explanations: { ref: string; basis: string }[];
  dataGaps: string[];
  copyText: string;
}

export interface AiSummaryResponse extends AiSummaryModelOutput {
  generatedAt: string;
  controlObject: { id: string; name: string };
}

/** JSON Schema для OpenAI response_format (strict). */
export const AI_SUMMARY_SCHEMA = {
  name: 'control_object_ai_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['state', 'mainRisks', 'questions', 'recommendations', 'explanations', 'dataGaps', 'copyText'],
    properties: {
      state: { type: 'string', description: 'Краткая интерпретация общего состояния объекта контроля' },
      mainRisks: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ref', 'title', 'level', 'text'],
          properties: {
            ref: { type: 'string', description: 'jiraKey эпика или название задачи оценки' },
            title: { type: 'string' },
            level: { type: 'string', enum: ['red', 'yellow', 'grey'] },
            text: { type: 'string' },
          },
        },
      },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ref', 'text'],
          properties: {
            ref: { type: 'string' },
            text: { type: 'string' },
          },
        },
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ref', 'action', 'text'],
          properties: {
            ref: { type: 'string' },
            action: { type: 'string', enum: [...ALLOWED_ACTIONS] },
            text: { type: 'string' },
          },
        },
      },
      explanations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ref', 'basis'],
          properties: {
            ref: { type: 'string' },
            basis: { type: 'string' },
          },
        },
      },
      dataGaps: { type: 'array', items: { type: 'string' } },
      copyText: { type: 'string', description: 'Готовый текст сводки для копирования в чат/письмо' },
    },
  },
} as const;
