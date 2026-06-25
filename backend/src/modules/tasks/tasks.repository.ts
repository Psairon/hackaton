import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskType } from './entities/task.entity';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  async findBySprintWithFilters(
    sprintId: string,
    filters: { type?: TaskType; status?: TaskStatus; assigneeId?: string },
  ): Promise<Task[]> {
    const qb = this.repo.createQueryBuilder('t').where('t.sprintId = :sprintId', { sprintId });
    if (filters.type) qb.andWhere('t.type = :type', { type: filters.type });
    if (filters.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters.assigneeId) qb.andWhere('t.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    return qb.getMany();
  }

  async findById(id: string): Promise<Task | null> {
    return this.repo.findOne({ where: { id }, relations: ['children'] });
  }

  async update(id: string, data: Partial<Task>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async saveMany(tasks: Partial<Task>[]): Promise<Task[]> {
    return this.repo.save(tasks.map((t) => this.repo.create(t)));
  }

  async findBySprint(sprintId: string): Promise<Task[]> {
    return this.repo.find({ where: { sprintId } });
  }
}
