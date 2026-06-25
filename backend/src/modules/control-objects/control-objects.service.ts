import { Injectable, NotFoundException } from '@nestjs/common';
import { ControlObjectsRepository } from './control-objects.repository';
import {
  CreateControlObjectDto,
  UpdateControlObjectDto,
} from './dto/control-object.dto';

@Injectable()
export class ControlObjectsService {
  constructor(private readonly repo: ControlObjectsRepository) {}

  create(projectId: string, dto: CreateControlObjectDto) {
    return this.repo.create({ ...dto, projectId });
  }

  findByProject(projectId: string) {
    return this.repo.findByProject(projectId);
  }

  async findById(id: string) {
    const obj = await this.repo.findById(id);
    if (!obj) throw new NotFoundException('Объект контроля не найден');
    return obj;
  }

  async update(id: string, dto: UpdateControlObjectDto) {
    await this.findById(id);
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }
}
