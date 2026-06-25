import { Injectable, BadRequestException } from '@nestjs/common';
import { ControlObjectsService } from '../control-objects/control-objects.service';
import { EmployeesService } from '../employees/employees.service';
import { Employee } from '../employees/entities/employee.entity';
import {
  parseStructureFile,
  parseWorklogFile,
  ParsedStructTask,
} from './jira.parser';
import {
  JiraRepository,
  EpicToSave,
  TaskToSave,
  WorklogToSave,
} from './jira.repository';
import { JiraTaskSource } from './entities/jira-task.entity';
import { WorklogMatch } from './entities/jira-worklog.entity';

interface TaskAgg extends TaskToSave {
  hoursByEmployee: Map<string, number>;
}

@Injectable()
export class JiraService {
  constructor(
    private readonly repo: JiraRepository,
    private readonly controlObjects: ControlObjectsService,
    private readonly employees: EmployeesService,
  ) {}

  async import(
    controlObjectId: string,
    deliveryKey: string,
    structureFile: Express.Multer.File,
    worklogFile: Express.Multer.File,
  ) {
    if (!deliveryKey) throw new BadRequestException('Не указан ключ поставки');
    if (!structureFile || !worklogFile) {
      throw new BadRequestException('Нужны оба файла: структура и трудозатраты');
    }
    await this.controlObjects.findById(controlObjectId);

    const structure = parseStructureFile(structureFile.buffer, deliveryKey.trim());
    const { worklogs } = parseWorklogFile(worklogFile.buffer);
    const warnings = [...structure.warnings];

    // Справочник сотрудников: индексы по логину и почте.
    const allEmployees = await this.employees.findAll();
    const byId = new Map(allEmployees.map((e) => [e.id, e]));
    const byLogin = new Map<string, Employee>();
    const byMail = new Map<string, Employee>();
    for (const e of allEmployees) {
      if (e.jiraIdentity) byLogin.set(e.jiraIdentity.toLowerCase(), e);
      if (e.mail) byMail.set(e.mail.toLowerCase(), e);
    }
    const resolveEmployee = (login: string | null): Employee | null => {
      if (!login) return null;
      const k = login.toLowerCase();
      return byLogin.get(k) ?? byMail.get(k) ?? null;
    };

    // Индекс задач структуры.
    const taskAgg = new Map<string, TaskAgg>();
    const epicByName = new Map(structure.epics.map((e) => [e.name, e.key]));
    const mkAgg = (t: Partial<TaskAgg> & { jiraKey: string }): TaskAgg => ({
      jiraKey: t.jiraKey,
      title: t.title ?? null,
      taskType: t.taskType ?? null,
      status: t.status ?? null,
      priority: t.priority ?? null,
      dueDate: t.dueDate ?? null,
      epicKey: t.epicKey ?? null,
      parentKey: t.parentKey ?? null,
      assigneeRaw: t.assigneeRaw ?? null,
      assigneeLogin: null,
      employeeId: null,
      direction: null,
      role: null,
      actualHours: 0,
      isSynthetic: t.isSynthetic ?? false,
      source: t.source ?? JiraTaskSource.STRUCTURE,
      dataQualityFlags: [],
      hoursByEmployee: new Map(),
    });

    for (const t of structure.tasks) {
      if (!t.key) continue;
      taskAgg.set(t.key, mkAgg({ ...mapStructTask(t) }));
    }

    // Матчинг worklog (3 шага) + агрегация факта.
    const worklogsToSave: WorklogToSave[] = [];
    let direct = 0,
      parent = 0,
      epic = 0,
      unmatched = 0;
    const unmatchedSamples: string[] = [];

    for (const w of worklogs) {
      const emp = resolveEmployee(w.assigneeLogin);
      let target: TaskAgg | null = null;
      let matchedBy: WorklogMatch | null = null;

      if (taskAgg.has(w.taskKey)) {
        target = taskAgg.get(w.taskKey)!;
        matchedBy = WorklogMatch.DIRECT;
        direct++;
      } else if (w.parentKey && taskAgg.has(w.parentKey)) {
        target = taskAgg.get(w.parentKey)!;
        matchedBy = WorklogMatch.PARENT;
        parent++;
      } else if (w.epicLink && epicByName.has(w.epicLink)) {
        // Синтетическая задача из worklog.
        let synth = taskAgg.get(w.taskKey);
        if (!synth) {
          synth = mkAgg({
            jiraKey: w.taskKey,
            title: w.taskName,
            taskType: w.taskType,
            epicKey: epicByName.get(w.epicLink) ?? null,
            isSynthetic: true,
            source: JiraTaskSource.WORKLOG,
          });
          taskAgg.set(w.taskKey, synth);
        }
        target = synth;
        matchedBy = WorklogMatch.EPIC;
        epic++;
      } else {
        unmatched++;
        if (unmatchedSamples.length < 10) unmatchedSamples.push(w.taskKey);
        continue;
      }

      target.actualHours += w.hours;
      if (emp) {
        target.hoursByEmployee.set(
          emp.id,
          (target.hoursByEmployee.get(emp.id) ?? 0) + w.hours,
        );
      }
      worklogsToSave.push({
        taskJiraKey: target.jiraKey,
        sourceTaskKey: w.taskKey,
        hours: w.hours,
        assigneeLogin: w.assigneeLogin,
        assigneeRaw: w.assigneeRaw,
        employeeId: emp?.id ?? null,
        taskType: w.taskType,
        parentKey: w.parentKey,
        epicLink: w.epicLink,
        workDate: w.workDate,
        matchedBy,
      });
    }

    // Доминирующий исполнитель/роль задачи + флаги качества данных (FR-12).
    const tasksToSave: TaskToSave[] = [];
    for (const t of taskAgg.values()) {
      let topId: string | null = null;
      let topH = -1;
      for (const [id, h] of t.hoursByEmployee) {
        if (h > topH) {
          topH = h;
          topId = id;
        }
      }
      if (topId) {
        const e = byId.get(topId)!;
        t.employeeId = e.id;
        t.assigneeLogin = e.jiraIdentity ?? t.assigneeLogin;
        t.direction = e.direction;
        t.role = e.role;
      }
      const flags: string[] = [];
      if (!t.epicKey) flags.push('no_epic');
      if (t.actualHours > 0 && !t.employeeId) flags.push('unresolved_assignee');
      if (t.actualHours === 0) flags.push('no_actual');
      if (!t.dueDate) flags.push('no_due_date');
      if (!t.direction) flags.push('no_direction');
      t.dataQualityFlags = flags;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hoursByEmployee, ...rest } = t;
      tasksToSave.push(rest);
    }

    const epicsToSave: EpicToSave[] = structure.epics.map((e) => ({
      jiraKey: e.key,
      title: e.name,
      status: e.status,
      priority: e.priority,
      dueDate: e.dueDate,
    }));

    await this.repo.saveImport(controlObjectId, epicsToSave, tasksToSave, worklogsToSave);

    const totalHours = tasksToSave.reduce((s, t) => s + t.actualHours, 0);
    const syntheticCount = tasksToSave.filter((t) => t.isSynthetic).length;
    if (unmatched > 0) {
      warnings.push(
        `${unmatched} worklog не сопоставлены с этой поставкой (часть — записи других поставок за период).`,
      );
    }

    return {
      deliveryFound: true,
      delivery: structure.delivery,
      epicsCount: epicsToSave.length,
      tasksCount: structure.tasks.length,
      syntheticCount,
      worklog: {
        direct,
        parent,
        epic,
        unmatched,
        unmatchedSamples,
      },
      totalHours: round2(totalHours),
      warnings,
    };
  }

  getEpics(controlObjectId: string) {
    return this.repo.findEpics(controlObjectId);
  }

  getTasks(controlObjectId: string) {
    return this.repo.findTasks(controlObjectId);
  }
}

function mapStructTask(t: ParsedStructTask) {
  return {
    jiraKey: t.key,
    title: t.name,
    taskType: t.taskType,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    assigneeRaw: t.assigneeRaw,
    epicKey: t.epicKey,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
