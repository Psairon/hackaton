import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Собирает грунтинг-контекст для AI строго из расчётного слоя (FR-20, 25).
 * AI получает только посчитанные показатели — никаких сырых данных и догадок.
 */
@Injectable()
export class AiContextBuilder {
  constructor(private readonly analytics: AnalyticsService) {}

  async build(controlObjectId: string) {
    const [comparison, dashboard, risks, dataQuality] = await Promise.all([
      this.analytics.comparison(controlObjectId),
      this.analytics.dashboard(controlObjectId),
      this.analytics.risks(controlObjectId),
      this.analytics.dataQuality(controlObjectId),
    ]);

    const byDeviation = <T extends { deviation: number }>(a: T, b: T) =>
      Math.abs(b.deviation) - Math.abs(a.deviation);

    const limitations: string[] = [
      'Нет current estimate / remaining — нельзя судить о росте текущей оценки и соответствии остатка сроку.',
      'Нет jira_updated_at — нельзя утверждать об отсутствии движения по задаче.',
    ];
    if (dataQuality.unlinkedEpics.length > 0) {
      limitations.push('Несвязанные эпики не участвуют в сравнении с baseline.');
    }
    if (dataQuality.unlinkedEstimateTasks.length > 0) {
      limitations.push('Несвязанные задачи оценки сравниваются только по baseline.');
    }

    const context = {
      controlObject: dashboard.controlObject,
      totals: {
        baselineHours: dashboard.baselineHours,
        actualHours: dashboard.actualHours,
        deviation: dashboard.deviation,
        usagePercent: dashboard.usagePercent,
        overallRisk: dashboard.overallRisk,
      },
      counts: {
        estimateTasks: dashboard.estimateTaskCount,
        epics: dashboard.epicCount,
        tasks: dashboard.taskCount,
        tasksInProgress: dashboard.tasksInProgress,
        tasksDone: dashboard.tasksDone,
        epicRisk: dashboard.epicRisk,
      },
      topEstimateTasks: [...comparison.estimateTasks]
        .sort(byDeviation)
        .slice(0, 10)
        .map((e) => ({
          ref: e.title,
          baselineHours: e.baselineHours,
          actualHours: e.actualHours,
          deviation: e.deviation,
          usagePercent: e.usagePercent,
          linkedEpicCount: e.linkedEpicCount,
          risk: e.risk,
          riskReasons: e.riskReasons,
        })),
      topEpics: [...comparison.epics]
        .sort(byDeviation)
        .slice(0, 10)
        .map((e) => ({
          ref: e.jiraKey,
          title: e.title,
          baselineHours: e.baselineHours,
          actualHours: e.actualHours,
          deviation: e.deviation,
          usagePercent: e.usagePercent,
          status: e.status,
          dueDate: e.dueDate,
          risk: e.risk,
          riskReasons: e.riskReasons,
        })),
      byDirection: comparison.byDirection,
      byRole: comparison.byRole,
      risks: risks.items.slice(0, 15),
      dataQuality: {
        unlinkedEstimateTasksCount: dataQuality.unlinkedEstimateTasks.length,
        unlinkedEstimateTasksSample: dataQuality.unlinkedEstimateTasks.slice(0, 5),
        unlinkedEpicsCount: dataQuality.unlinkedEpics.length,
        unlinkedEpicsSample: dataQuality.unlinkedEpics.slice(0, 5),
        tasksWithIssuesCount: dataQuality.tasksWithIssues.length,
      },
      limitations,
    };

    const isEmpty = dashboard.estimateTaskCount === 0 && dashboard.taskCount === 0;
    return { context, isEmpty, controlObject: dashboard.controlObject };
  }
}
