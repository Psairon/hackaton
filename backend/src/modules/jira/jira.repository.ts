import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Direction, Role } from '../../common/enums/reference.enum';
import { JiraEpic } from './entities/jira-epic.entity';
import { JiraTask, JiraTaskSource } from './entities/jira-task.entity';
import { JiraWorklog, WorklogMatch } from './entities/jira-worklog.entity';

export interface EpicToSave {
  jiraKey: string;
  title: string;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
}

export interface TaskToSave {
  jiraKey: string;
  title: string | null;
  taskType: string | null;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  epicKey: string | null;
  parentKey: string | null;
  assigneeRaw: string | null;
  assigneeLogin: string | null;
  employeeId: string | null;
  direction: Direction | null;
  role: Role | null;
  actualHours: number;
  isSynthetic: boolean;
  source: JiraTaskSource;
  dataQualityFlags: string[];
}

export interface WorklogToSave {
  taskJiraKey: string; // на какую задачу легли часы
  sourceTaskKey: string | null;
  hours: number;
  assigneeLogin: string | null;
  assigneeRaw: string | null;
  employeeId: string | null;
  taskType: string | null;
  parentKey: string | null;
  epicLink: string | null;
  workDate: string | null;
  matchedBy: WorklogMatch;
}

@Injectable()
export class JiraRepository {
  constructor(
    @InjectRepository(JiraEpic) private readonly epics: Repository<JiraEpic>,
    @InjectRepository(JiraTask) private readonly tasks: Repository<JiraTask>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Идемпотентный импорт (FR-06): эпики upsert по ключу (с сохранением ручных связок),
   * задачи и worklog полностью пересоздаются.
   */
  async saveImport(
    controlObjectId: string,
    epics: EpicToSave[],
    tasks: TaskToSave[],
    worklogs: WorklogToSave[],
  ): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      // Снести прежние worklog и задачи поставки.
      await m.delete(JiraWorklog, { controlObjectId });
      await m.delete(JiraTask, { controlObjectId });

      // Upsert эпиков (сохраняя estimateTaskId / linkSource).
      const existing = await m.find(JiraEpic, { where: { controlObjectId } });
      const byKey = new Map(existing.map((e) => [e.jiraKey, e]));
      const epicIdByKey = new Map<string, string>();
      for (const e of epics) {
        const prev = byKey.get(e.jiraKey);
        const saved = await m.save(
          m.create(JiraEpic, {
            id: prev?.id,
            controlObjectId,
            jiraKey: e.jiraKey,
            title: e.title,
            status: e.status ?? undefined,
            priority: e.priority ?? undefined,
            dueDate: e.dueDate ?? undefined,
            estimateTaskId: prev?.estimateTaskId,
            linkSource: prev?.linkSource,
          }),
        );
        epicIdByKey.set(e.jiraKey, saved.id);
      }

      // Задачи.
      const taskIdByKey = new Map<string, string>();
      for (const t of tasks) {
        const saved = await m.save(
          m.create(JiraTask, {
            controlObjectId,
            jiraKey: t.jiraKey,
            title: t.title ?? undefined,
            taskType: t.taskType ?? undefined,
            status: t.status ?? undefined,
            priority: t.priority ?? undefined,
            dueDate: t.dueDate ?? undefined,
            epicId: t.epicKey ? epicIdByKey.get(t.epicKey) : undefined,
            epicKey: t.epicKey ?? undefined,
            parentKey: t.parentKey ?? undefined,
            assigneeRaw: t.assigneeRaw ?? undefined,
            assigneeLogin: t.assigneeLogin ?? undefined,
            employeeId: t.employeeId ?? undefined,
            direction: t.direction ?? undefined,
            role: t.role ?? undefined,
            actualHours: t.actualHours,
            isSynthetic: t.isSynthetic,
            source: t.source,
            dataQualityFlags: t.dataQualityFlags,
          }),
        );
        taskIdByKey.set(t.jiraKey, saved.id);
      }

      // Worklog.
      const wlEntities = worklogs
        .map((w) => {
          const taskId = taskIdByKey.get(w.taskJiraKey);
          if (!taskId) return null;
          return m.create(JiraWorklog, {
            controlObjectId,
            jiraTaskId: taskId,
            sourceTaskKey: w.sourceTaskKey ?? undefined,
            hours: w.hours,
            assigneeLogin: w.assigneeLogin ?? undefined,
            assigneeRaw: w.assigneeRaw ?? undefined,
            employeeId: w.employeeId ?? undefined,
            taskType: w.taskType ?? undefined,
            parentKey: w.parentKey ?? undefined,
            epicLink: w.epicLink ?? undefined,
            workDate: w.workDate ?? undefined,
            matchedBy: w.matchedBy,
          });
        })
        .filter((x): x is JiraWorklog => x !== null);
      if (wlEntities.length) await m.save(wlEntities);
    });
  }

  findEpics(controlObjectId: string): Promise<JiraEpic[]> {
    return this.epics.find({ where: { controlObjectId }, order: { jiraKey: 'ASC' } });
  }

  findTasks(controlObjectId: string): Promise<JiraTask[]> {
    return this.tasks.find({
      where: { controlObjectId },
      relations: ['epic', 'employee'],
      order: { jiraKey: 'ASC' },
    });
  }
}
