import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiContextBuilder } from './ai.context-builder';
import {
  AI_SUMMARY_SCHEMA,
  ALLOWED_ACTIONS,
  AiSummaryModelOutput,
  AiSummaryResponse,
} from './ai.types';

const SYSTEM_PROMPT = `Ты — ассистент PM / Team Lead. Анализируешь расчётные данные объекта контроля (план/факт по baseline) и формируешь управленческую сводку на русском языке.

Жёсткие правила:
- Используй ТОЛЬКО переданные данные (показатели, риски, качество данных). Ничего не выдумывай.
- Каждый вывод, риск, вопрос и рекомендация должны быть привязаны к конкретному элементу через поле ref (jiraKey эпика или название задачи оценки) и опираться на показатель (отклонение, % использования baseline, статус риска).
- Если данных не хватает — честно перечисли это в dataGaps. Не делай выводов о росте оценки, остатке или отсутствии движения: этих данных нет (см. limitations).
- Рекомендации формулируй как предложения; поле action выбирай строго из допустимого списка: ${ALLOWED_ACTIONS.join(', ')}.
- Вопросы должны быть готовы к использованию на daily без расшифровки и не дублировать очевидные поля.
- В explanations для каждого ключевого вывода укажи основание (какой показатель/риск).
- copyText — компактная готовая сводка для отправки в чат/письмо: состояние, главные риски, 2-4 вопроса.`;

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private readonly contextBuilder: AiContextBuilder,
    config: ConfigService,
  ) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
  }

  /** AI-сводка объекта контроля (FR-20, 21, 24, 25). */
  async summary(controlObjectId: string): Promise<AiSummaryResponse> {
    const { context, isEmpty, controlObject } =
      await this.contextBuilder.build(controlObjectId);
    const generatedAt = new Date().toISOString();

    if (isEmpty) {
      return {
        generatedAt,
        controlObject,
        state: 'Недостаточно данных для анализа: не загружены baseline и/или Jira-выгрузка.',
        mainRisks: [],
        questions: [],
        recommendations: [],
        explanations: [],
        dataGaps: [
          'Не загружен baseline (нет задач оценки).',
          'Не загружена Jira-выгрузка (нет факта).',
        ],
        copyText: this.header(controlObject.name, generatedAt) +
          'Недостаточно данных для анализа: загрузите baseline и Jira-выгрузку.',
      };
    }

    let output: AiSummaryModelOutput;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: 'json_schema', json_schema: AI_SUMMARY_SCHEMA },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(context) },
        ],
      });
      const content = response.choices[0]?.message?.content ?? '{}';
      output = JSON.parse(content) as AiSummaryModelOutput;
    } catch (e) {
      throw new ServiceUnavailableException(
        `AI-сервис недоступен: ${(e as Error).message}`,
      );
    }

    return {
      generatedAt,
      controlObject,
      ...output,
      // FR-27: гарантируем заголовок с названием объекта и датой.
      copyText: this.header(controlObject.name, generatedAt) + output.copyText,
    };
  }

  private header(name: string, generatedAt: string): string {
    const date = generatedAt.slice(0, 10);
    return `Сводка по объекту «${name}» — ${date}\n\n`;
  }
}
