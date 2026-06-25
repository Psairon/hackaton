import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintsRepository } from './sprints.repository';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { SprintStatus } from './entities/sprint.entity';

@Injectable()
export class SprintsService {
  constructor(private readonly repo: SprintsRepository) {}

  async create(projectId: string, dto: CreateSprintDto) {
    if (dto.startDate && dto.endDate && dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate должна быть позже startDate');
    }
    return this.repo.create({ ...dto, projectId });
  }

  async findByProject(projectId: string) {
    return this.repo.findByProject(projectId);
  }

  async findById(id: string) {
    const sprint = await this.repo.findById(id);
    if (!sprint) throw new NotFoundException('Спринт не найден');
    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto) {
    const sprint = await this.findById(id);
    if (sprint.status === SprintStatus.ARCHIVED && dto.status === SprintStatus.ACTIVE) {
      throw new BadRequestException('Нельзя вернуть архивный спринт в активный');
    }
    if (dto.startDate && dto.endDate && dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate должна быть позже startDate');
    }
    await this.repo.update(id, dto);
    return this.repo.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }
}
