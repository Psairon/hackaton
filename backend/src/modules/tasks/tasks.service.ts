import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { UpdateTaskDto, TaskFilterDto } from './dto/task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(private readonly repo: TasksRepository) {}

  async findTree(sprintId: string, filters: TaskFilterDto) {
    const tasks = await this.repo.findBySprintWithFilters(sprintId, filters);
    return this.buildTree(tasks);
  }

  async findById(id: string) {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findById(id);
    await this.repo.update(id, dto);
    return this.repo.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async importStub(sprintId: string, file: Express.Multer.File) {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    return { message: 'import received', rowCount: rows.length };
  }

  findBySprint(sprintId: string) {
    return this.repo.findBySprint(sprintId);
  }

  private buildTree(tasks: Task[]): Task[] {
    const map = new Map<string, Task & { children: Task[] }>();
    tasks.forEach((t) => map.set(t.id, { ...t, children: [] }));
    const roots: Task[] = [];
    map.forEach((task) => {
      if (task.parentId && map.has(task.parentId)) {
        map.get(task.parentId)!.children.push(task);
      } else {
        roots.push(task);
      }
    });
    return roots;
  }
}
