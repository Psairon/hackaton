import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EstimatesRepository } from './estimates.repository';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class EstimatesService {
  constructor(
    private readonly repo: EstimatesRepository,
    private readonly tasksService: TasksService,
  ) {}

  async importStub(sprintId: string, file: Express.Multer.File) {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    return { message: 'import received', rowCount: rows.length };
  }

  async findBySprint(sprintId: string) {
    return this.repo.findBySprint(sprintId);
  }

  async findById(id: string) {
    const estimate = await this.repo.findById(id);
    if (!estimate) throw new NotFoundException('Смета не найдена');
    return estimate;
  }

  async linkTask(itemId: string, taskId: string) {
    const item = await this.repo.findItemById(itemId);
    if (!item) throw new NotFoundException('Элемент сметы не найден');

    const estimate = await this.repo.findById(item.estimateId);
    const task = await this.tasksService.findById(taskId);

    if (estimate!.sprintId !== task.sprintId) {
      throw new BadRequestException('Task и EstimateItem должны принадлежать одному спринту');
    }

    await this.repo.updateItem(itemId, { linkedTaskId: taskId });
    return this.repo.findItemById(itemId);
  }

  async unlinkTask(itemId: string) {
    const item = await this.repo.findItemById(itemId);
    if (!item) throw new NotFoundException('Элемент сметы не найден');
    await this.repo.updateItem(itemId, { linkedTaskId: undefined });
    return this.repo.findItemById(itemId);
  }

  async findAllItemsBySprint(sprintId: string) {
    return this.repo.findAllItemsBySprint(sprintId);
  }
}
