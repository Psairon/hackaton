import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BaselineRepository } from './baseline.repository';
import { ControlObjectsService } from '../control-objects/control-objects.service';
import { parseBaselineBuffer } from './baseline.parser';

@Injectable()
export class BaselineService {
  constructor(
    private readonly repo: BaselineRepository,
    private readonly controlObjects: ControlObjectsService,
  ) {}

  /** Импорт baseline из Excel/CSV (FR-02, FR-03, FR-04). */
  async import(controlObjectId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    await this.controlObjects.findById(controlObjectId); // 404 если объекта нет

    let parsed;
    try {
      parsed = parseBaselineBuffer(file.buffer);
    } catch {
      throw new BadRequestException('Не удалось прочитать файл — ожидается Excel/CSV');
    }

    if (parsed.tasks.length === 0) {
      throw new BadRequestException({
        message: 'В файле не найдено ни одной задачи оценки',
        warnings: parsed.warnings,
      });
    }

    const baseline = await this.repo.saveParsed(
      controlObjectId,
      file.originalname,
      parsed,
    );

    return {
      baselineId: baseline.id,
      tasksCount: parsed.tasks.length,
      totalHours: parsed.totalHours,
      declaredTotalHours: parsed.declaredTotalHours,
      warnings: parsed.warnings,
    };
  }

  /** Активный baseline объекта контроля + задачи оценки. */
  async getActive(controlObjectId: string) {
    await this.controlObjects.findById(controlObjectId);
    const baseline = await this.repo.findActive(controlObjectId);
    if (!baseline) {
      return { baseline: null, estimateTasks: [] };
    }
    const estimateTasks = await this.repo.findActiveEstimateTasks(baseline.id);
    return { baseline, estimateTasks };
  }

  /** Список задач оценки объекта контроля (FR-16). */
  async getEstimateTasks(controlObjectId: string) {
    await this.controlObjects.findById(controlObjectId);
    return this.repo.findEstimateTasks(controlObjectId);
  }

  async getEstimateTask(id: string) {
    const task = await this.repo.findTaskById(id);
    if (!task) throw new NotFoundException('Задача оценки не найдена');
    return task;
  }
}
