import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';

@Injectable()
export class SprintsRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  async create(data: Partial<Sprint>): Promise<Sprint> {
    return this.repo.save(this.repo.create(data));
  }

  async findByProject(projectId: string): Promise<Sprint[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Sprint | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Sprint>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
