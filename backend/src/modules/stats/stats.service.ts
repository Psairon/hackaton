import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskType } from '../tasks/entities/task.entity';
import { Sprint, SprintStatus } from '../sprints/entities/sprint.entity';
import { EstimateItem } from '../estimates/entities/estimate-item.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(Sprint) private readonly sprints: Repository<Sprint>,
    @InjectRepository(EstimateItem) private readonly estimateItems: Repository<EstimateItem>,
  ) {}

  async sprintTaskStats(sprintId: string) {
    const tasks = await this.tasks.find({ where: { sprintId } });

    const byStatus = Object.values(TaskStatus).reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<string, number>);
    const byType = Object.values(TaskType).reduce((acc, t) => ({ ...acc, [t]: 0 }), {} as Record<string, number>);
    let totalEstimatedHours = 0;
    let totalActualHours = 0;

    tasks.forEach((t) => {
      byStatus[t.status]++;
      byType[t.type]++;
      totalEstimatedHours += t.estimatedHours ?? 0;
      totalActualHours += t.actualHours ?? 0;
    });

    return { total: tasks.length, byStatus, byType, totalEstimatedHours, totalActualHours };
  }

  async sprintDepartmentStats(sprintId: string) {
    const tasks = await this.tasks.find({ where: { sprintId } });

    const map = new Map<string, { estimatedHours: number; actualHours: number; taskCount: number }>();
    tasks.forEach((t) => {
      const key = t.type;
      const cur = map.get(key) ?? { estimatedHours: 0, actualHours: 0, taskCount: 0 };
      map.set(key, {
        estimatedHours: cur.estimatedHours + (t.estimatedHours ?? 0),
        actualHours: cur.actualHours + (t.actualHours ?? 0),
        taskCount: cur.taskCount + 1,
      });
    });

    const departments = Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
    return { departments };
  }

  async sprintEstimateStats(sprintId: string) {
    const items = await this.estimateItems
      .createQueryBuilder('i')
      .innerJoin('i.estimate', 'e')
      .where('e.sprintId = :sprintId', { sprintId })
      .getMany();

    const tasks = await this.tasks.find({ where: { sprintId } });

    const totalEstimateHours = items.reduce((s, i) => s + i.estimatedHours, 0);
    const totalTaskHours = tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    const linkedItemsCount = items.filter((i) => i.linkedTaskId).length;
    const unlinkedItemsCount = items.length - linkedItemsCount;

    return { totalEstimateHours, totalTaskHours, linkedItemsCount, unlinkedItemsCount };
  }

  async projectOverview(projectId: string) {
    const sprintList = await this.sprints.find({ where: { projectId } });
    const sprintIds = sprintList.map((s) => s.id);

    let totalTasks = 0;
    let completedTasks = 0;
    let totalEstimatedHours = 0;

    if (sprintIds.length > 0) {
      const tasks = await this.tasks
        .createQueryBuilder('t')
        .where('t.sprintId IN (:...sprintIds)', { sprintIds })
        .getMany();
      totalTasks = tasks.length;
      completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
      totalEstimatedHours = tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    }

    const activeSprint = sprintList.find((s) => s.status === SprintStatus.ACTIVE);

    return {
      sprintsCount: sprintList.length,
      activeSprintId: activeSprint?.id ?? null,
      totalTasks,
      completedTasks,
      totalEstimatedHours,
    };
  }
}
