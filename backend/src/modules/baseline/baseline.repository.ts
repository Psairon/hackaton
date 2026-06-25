import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Baseline } from './entities/baseline.entity';
import { EstimateTask } from './entities/estimate-task.entity';
import { EstimateTaskHours } from './entities/estimate-task-hours.entity';
import { ParsedBaseline } from './baseline.parser';

@Injectable()
export class BaselineRepository {
  constructor(
    @InjectRepository(Baseline)
    private readonly baselines: Repository<Baseline>,
    @InjectRepository(EstimateTask)
    private readonly tasks: Repository<EstimateTask>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Сохраняет baseline + задачи оценки + часы в одной транзакции,
   * предварительно деактивируя прежние baseline объекта контроля (FR-02).
   */
  async saveParsed(
    controlObjectId: string,
    sourceFileName: string,
    parsed: ParsedBaseline,
  ): Promise<Baseline> {
    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        Baseline,
        { controlObjectId, isActive: true },
        { isActive: false },
      );

      const baseline = await manager.save(
        manager.create(Baseline, {
          controlObjectId,
          sourceFileName,
          totalHours: parsed.totalHours,
          declaredTotalHours: parsed.declaredTotalHours ?? undefined,
          isActive: true,
        }),
      );

      for (const t of parsed.tasks) {
        const task = await manager.save(
          manager.create(EstimateTask, {
            baselineId: baseline.id,
            controlObjectId,
            externalNumber: t.externalNumber ?? undefined,
            title: t.title,
            description: t.description ?? undefined,
            externalEpicKey: t.externalEpicKey ?? undefined,
            totalHours: t.totalHours,
            declaredHours: t.declaredHours ?? undefined,
          }),
        );
        if (t.hours.length > 0) {
          await manager.save(
            t.hours.map((h) =>
              manager.create(EstimateTaskHours, {
                estimateTaskId: task.id,
                direction: h.direction,
                role: h.role,
                plannedHours: h.plannedHours,
              }),
            ),
          );
        }
      }

      return baseline;
    });
  }

  findActive(controlObjectId: string): Promise<Baseline | null> {
    return this.baselines.findOne({
      where: { controlObjectId, isActive: true },
    });
  }

  findEstimateTasks(controlObjectId: string): Promise<EstimateTask[]> {
    return this.tasks.find({
      where: { controlObjectId },
      relations: ['hours'],
      order: { createdAt: 'ASC' },
    });
  }

  findActiveEstimateTasks(baselineId: string): Promise<EstimateTask[]> {
    return this.tasks.find({
      where: { baselineId },
      relations: ['hours'],
      order: { createdAt: 'ASC' },
    });
  }

  findTaskById(id: string): Promise<EstimateTask | null> {
    return this.tasks.findOne({ where: { id }, relations: ['hours'] });
  }
}
