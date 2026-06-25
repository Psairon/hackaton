import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class AiService {
  private readonly client: OpenAI;

  constructor(
    private readonly statsService: StatsService,
    config: ConfigService,
  ) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
  }

  async sprintSummary(sprintId: string): Promise<{ summary: string }> {
    const [taskStats, deptStats] = await Promise.all([
      this.statsService.sprintTaskStats(sprintId),
      this.statsService.sprintDepartmentStats(sprintId),
    ]);

    const prompt = `Ты аналитик проекта. Вот данные спринта:

Статистика задач: ${JSON.stringify(taskStats, null, 2)}
Статистика по отделам: ${JSON.stringify(deptStats, null, 2)}

Напиши краткое саммари на русском языке: прогресс, узкие места, отделы с перегрузкой. Будь конкретен и лаконичен.`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = response.choices[0].message.content ?? '';
    return { summary };
  }

  async sprintRisks(sprintId: string): Promise<{ summary: string }> {
    const [taskStats, deptStats, estimateStats] = await Promise.all([
      this.statsService.sprintTaskStats(sprintId),
      this.statsService.sprintDepartmentStats(sprintId),
      this.statsService.sprintEstimateStats(sprintId),
    ]);

    const prompt = `Ты аналитик проекта. Вот данные спринта:

Статистика задач: ${JSON.stringify(taskStats, null, 2)}
Статистика по отделам: ${JSON.stringify(deptStats, null, 2)}
Статистика оценок: ${JSON.stringify(estimateStats, null, 2)}

Выяви риски спринта и дай конкретные рекомендации на русском языке. Перечисли топ-3 риска и действия по митигации.`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = response.choices[0].message.content ?? '';
    return { summary };
  }
}
