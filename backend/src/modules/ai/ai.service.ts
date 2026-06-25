import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(
    private readonly statsService: StatsService,
    config: ConfigService,
  ) {
    this.client = new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') });
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

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = (message.content[0] as any).text as string;
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

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = (message.content[0] as any).text as string;
    return { summary };
  }
}
