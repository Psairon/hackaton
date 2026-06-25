import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControlObject } from './entities/control-object.entity';

@Injectable()
export class ControlObjectsRepository {
  constructor(
    @InjectRepository(ControlObject)
    private readonly repo: Repository<ControlObject>,
  ) {}

  create(data: Partial<ControlObject>): Promise<ControlObject> {
    return this.repo.save(this.repo.create(data));
  }

  findByProject(projectId: string): Promise<ControlObject[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<ControlObject | null> {
    return this.repo.findOne({ where: { id }, relations: ['responsible'] });
  }

  async update(id: string, data: Partial<ControlObject>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
