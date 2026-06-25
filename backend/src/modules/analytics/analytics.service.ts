import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControlObjectsService } from '../control-objects/control-objects.service';
import { Baseline } from '../baseline/entities/baseline.entity';
import { EstimateTask } from '../baseline/entities/estimate-task.entity';
import { JiraEpic } from '../jira/entities/jira-epic.entity';
import { JiraTask } from '../jira/entities/jira-task.entity';
import { JiraWorklog } from '../jira/entities/jira-worklog.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ControlObject } from '../control-objects/entities/control-object.entity';
import { computeRisk, RiskLevel } from '../../common/risk.util';
import { Direction, Role } from '../../common/enums/reference.enum';

const r2 = (n: number) => Math.round(n * 100) / 100;

interface Ctx {
  controlObject: ControlObject;
  estimateTasks: EstimateTask[]; // активного baseline, с relations.hours
  epics: JiraEpic[];
  tasks: JiraTask[];
  epicActual: Map<string, number>;
  epicTaskCount: Map<string, number>;
}

function isDone(status?: string | null) {
  return !!status && /clos|done|готов|выполн/i.test(status);
}
function isInProgress(status?: string | null) {
  return !!status && /progress|работ|review|ревью/i.test(status);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly controlObjects: ControlObjectsService,
    @InjectRepository(Baseline) private readonly baselines: Repository<Baseline>,
    @InjectRepository(EstimateTask) private readonly estimateTasks: Repository<EstimateTask>,
    @InjectRepository(JiraEpic) private readonly epics: Repository<JiraEpic>,
    @InjectRepository(JiraTask) private readonly tasks: Repository<JiraTask>,
    @InjectRepository(JiraWorklog) private readonly worklogs: Repository<JiraWorklog>,
  ) {}

  private async load(controlObjectId: string): Promise<Ctx> {
    const controlObject = await this.controlObjects.findById(controlObjectId);
    const baseline = await this.baselines.findOne({
      where: { controlObjectId, isActive: true },
    });
    const estimateTasks = baseline
      ? await this.estimateTasks.find({
          where: { baselineId: baseline.id },
          relations: ['hours'],
        })
      : [];
    const epics = await this.epics.find({ where: { controlObjectId } });
    const tasks = await this.tasks.find({ where: { controlObjectId } });

    const epicActual = new Map<string, number>();
    const epicTaskCount = new Map<string, number>();
    for (const t of tasks) {
      if (!t.epicId) continue;
      epicActual.set(t.epicId, (epicActual.get(t.epicId) ?? 0) + (t.actualHours ?? 0));
      epicTaskCount.set(t.epicId, (epicTaskCount.get(t.epicId) ?? 0) + 1);
    }
    return { controlObject, estimateTasks, epics, tasks, epicActual, epicTaskCount };
  }

  private etBaseline(et: EstimateTask): number {
    return (et.hours ?? []).reduce((s, h) => s + (h.plannedHours ?? 0), 0);
  }

  /** Сравнение baseline/actual по уровням (FR-13). */
  async comparison(controlObjectId: string) {
    const ctx = await this.load(controlObjectId);
    const refDate = ctx.controlObject.plannedEndDate
      ? new Date(ctx.controlObject.plannedEndDate)
      : new Date();

    // Эпики по задачам оценки.
    const epicsByEt = new Map<string, JiraEpic[]>();
    for (const e of ctx.epics) {
      if (!e.estimateTaskId) continue;
      const arr = epicsByEt.get(e.estimateTaskId) ?? [];
      arr.push(e);
      epicsByEt.set(e.estimateTaskId, arr);
    }

    const estimateTasks = ctx.estimateTasks.map((et) => {
      const baselineHours = this.etBaseline(et);
      const linked = epicsByEt.get(et.id) ?? [];
      const actualHours = linked.reduce((s, e) => s + (ctx.epicActual.get(e.id) ?? 0), 0);
      const incomplete = linked.length === 0;
      const risk = computeRisk({
        baselineHours,
        actualHours,
        incomplete,
        incompleteReason: 'Задача оценки не связана с Jira Epic',
      });
      return {
        id: et.id,
        title: et.title,
        baselineHours: r2(baselineHours),
        actualHours: r2(actualHours),
        deviation: r2(actualHours - baselineHours),
        usagePercent: risk.usagePercent,
        linkedEpicCount: linked.length,
        risk: risk.level,
        riskReasons: risk.reasons,
      };
    });

    // Эпики.
    const etById = new Map(ctx.estimateTasks.map((e) => [e.id, e]));
    const epics = ctx.epics.map((e) => {
      const actualHours = ctx.epicActual.get(e.id) ?? 0;
      const et = e.estimateTaskId ? etById.get(e.estimateTaskId) : null;
      const baselineHours = et ? this.etBaseline(et) : 0;
      const incomplete = !e.estimateTaskId;
      const risk = computeRisk({
        baselineHours,
        actualHours,
        dueDate: e.dueDate,
        refDate,
        incomplete,
        incompleteReason: 'Эпик не связан с задачей оценки',
      });
      return {
        id: e.id,
        jiraKey: e.jiraKey,
        title: e.title,
        estimateTaskId: e.estimateTaskId ?? null,
        status: e.status,
        dueDate: e.dueDate,
        baselineHours: r2(baselineHours),
        actualHours: r2(actualHours),
        deviation: r2(actualHours - baselineHours),
        usagePercent: risk.usagePercent,
        taskCount: ctx.epicTaskCount.get(e.id) ?? 0,
        risk: risk.level,
        riskReasons: risk.reasons,
      };
    });

    const { byDirection, byRole } = await this.byDimension(ctx, refDate);

    const projBaseline = estimateTasks.reduce((s, e) => s + e.baselineHours, 0);
    const projActual = ctx.tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);
    const projRisk = computeRisk({
      baselineHours: projBaseline,
      actualHours: projActual,
      dueDate: ctx.controlObject.plannedEndDate,
    });

    return {
      project: {
        baselineHours: r2(projBaseline),
        actualHours: r2(projActual),
        deviation: r2(projActual - projBaseline),
        usagePercent: projRisk.usagePercent,
        risk: projRisk.level,
        riskReasons: projRisk.reasons,
      },
      estimateTasks,
      epics,
      byDirection,
      byRole,
    };
  }

  /** План/факт по направлениям и ролям (FR-15). */
  private async byDimension(ctx: Ctx, refDate: Date) {
    // baseline по (direction, role)
    const baseDir = new Map<string, number>();
    const baseRole = new Map<string, number>();
    for (const et of ctx.estimateTasks) {
      for (const h of et.hours ?? []) {
        baseDir.set(h.direction, (baseDir.get(h.direction) ?? 0) + h.plannedHours);
        const k = `${h.direction}|${h.role}`;
        baseRole.set(k, (baseRole.get(k) ?? 0) + h.plannedHours);
      }
    }
    // actual из worklog + справочник
    const rows: Array<{ direction: string | null; role: string | null; hours: string }> =
      await this.worklogs
        .createQueryBuilder('w')
        .leftJoin(Employee, 'e', 'e.id = w."employeeId"')
        .select('e.direction', 'direction')
        .addSelect('e.role', 'role')
        .addSelect('SUM(w.hours)', 'hours')
        .where('w."controlObjectId" = :id', { id: ctx.controlObject.id })
        .groupBy('e.direction')
        .addGroupBy('e.role')
        .getRawMany();

    const actDir = new Map<string, number>();
    const actRole = new Map<string, number>();
    let unresolvedActual = 0;
    for (const row of rows) {
      const hours = Number(row.hours) || 0;
      if (!row.direction || !row.role) {
        unresolvedActual += hours;
        continue;
      }
      actDir.set(row.direction, (actDir.get(row.direction) ?? 0) + hours);
      actRole.set(`${row.direction}|${row.role}`, (actRole.get(`${row.direction}|${row.role}`) ?? 0) + hours);
    }

    const dirKeys = new Set([...baseDir.keys(), ...actDir.keys()]);
    const byDirection = [...dirKeys].map((direction) => {
      const baselineHours = baseDir.get(direction) ?? 0;
      const actualHours = actDir.get(direction) ?? 0;
      const risk = computeRisk({ baselineHours, actualHours });
      return {
        direction: direction as Direction,
        baselineHours: r2(baselineHours),
        actualHours: r2(actualHours),
        deviation: r2(actualHours - baselineHours),
        usagePercent: risk.usagePercent,
        risk: risk.level,
      };
    });

    const roleKeys = new Set([...baseRole.keys(), ...actRole.keys()]);
    const byRole = [...roleKeys].map((k) => {
      const [direction, role] = k.split('|');
      const baselineHours = baseRole.get(k) ?? 0;
      const actualHours = actRole.get(k) ?? 0;
      const risk = computeRisk({ baselineHours, actualHours });
      return {
        direction: direction as Direction,
        role: role as Role,
        baselineHours: r2(baselineHours),
        actualHours: r2(actualHours),
        deviation: r2(actualHours - baselineHours),
        usagePercent: risk.usagePercent,
        risk: risk.level,
      };
    });

    return { byDirection, byRole, unresolvedActual: r2(unresolvedActual) };
  }

  /** Верхнеуровневый дашборд (FR-14). */
  async dashboard(controlObjectId: string) {
    const cmp = await this.comparison(controlObjectId);
    const ctx = await this.load(controlObjectId);

    const tasksDone = ctx.tasks.filter((t) => isDone(t.status)).length;
    const tasksInProgress = ctx.tasks.filter((t) => isInProgress(t.status)).length;
    const unlinkedEstimateTasks = cmp.estimateTasks.filter((e) => e.linkedEpicCount === 0).length;
    const unlinkedEpics = ctx.epics.filter((e) => !e.estimateTaskId).length;
    const tasksNeedReview = ctx.tasks.filter((t) => (t.dataQualityFlags ?? []).length > 0).length;

    const riskCounts = (items: { risk: RiskLevel }[]) =>
      items.reduce(
        (acc, i) => ({ ...acc, [i.risk]: (acc as any)[i.risk] + 1 }),
        { green: 0, yellow: 0, red: 0, grey: 0 } as Record<RiskLevel, number>,
      );

    return {
      controlObject: {
        id: ctx.controlObject.id,
        name: ctx.controlObject.name,
        plannedEndDate: ctx.controlObject.plannedEndDate,
      },
      baselineHours: cmp.project.baselineHours,
      actualHours: cmp.project.actualHours,
      deviation: cmp.project.deviation,
      usagePercent: cmp.project.usagePercent,
      overallRisk: cmp.project.risk,
      estimateTaskCount: cmp.estimateTasks.length,
      epicCount: ctx.epics.length,
      taskCount: ctx.tasks.length,
      tasksInProgress,
      tasksDone,
      epicRisk: riskCounts(cmp.epics),
      warnings: { unlinkedEstimateTasks, unlinkedEpics, tasksNeedReview },
    };
  }

  /** Контроль сроков + индикаторы риска (FR-18, FR-19). */
  async risks(controlObjectId: string) {
    const cmp = await this.comparison(controlObjectId);
    const items = [
      ...cmp.epics
        .filter((e) => e.risk !== RiskLevel.GREEN)
        .map((e) => ({
          level: e.risk,
          kind: 'epic',
          ref: e.jiraKey,
          title: e.title,
          reasons: e.riskReasons,
        })),
      ...cmp.estimateTasks
        .filter((e) => e.risk !== RiskLevel.GREEN)
        .map((e) => ({
          level: e.risk,
          kind: 'estimate_task',
          ref: e.id,
          title: e.title,
          reasons: e.riskReasons,
        })),
    ];
    const order = { red: 0, yellow: 1, grey: 2, green: 3 } as Record<string, number>;
    items.sort((a, b) => order[a.level] - order[b.level]);
    return { items };
  }

  /** Блок «Требует проверки» (FR-12). */
  async dataQuality(controlObjectId: string) {
    const ctx = await this.load(controlObjectId);
    const linkedEtIds = new Set(ctx.epics.map((e) => e.estimateTaskId).filter(Boolean));

    return {
      unlinkedEstimateTasks: ctx.estimateTasks
        .filter((et) => !linkedEtIds.has(et.id))
        .map((et) => ({ id: et.id, title: et.title })),
      unlinkedEpics: ctx.epics
        .filter((e) => !e.estimateTaskId)
        .map((e) => ({ id: e.id, jiraKey: e.jiraKey, title: e.title })),
      tasksWithIssues: ctx.tasks
        .filter((t) => (t.dataQualityFlags ?? []).length > 0)
        .map((t) => ({ id: t.id, jiraKey: t.jiraKey, title: t.title, flags: t.dataQualityFlags })),
    };
  }
}
