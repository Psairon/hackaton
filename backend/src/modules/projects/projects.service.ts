import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  async create(dto: CreateProjectDto, user: User) {
    return this.repo.create({ ...dto, adminId: user.id });
  }

  async findAllForUser(user: User) {
    return this.repo.findForUser(user.id);
  }

  async findById(id: string) {
    const project = await this.repo.findById(id);
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: User) {
    await this.assertAdmin(id, user.id);
    await this.repo.update(id, dto);
    return this.repo.findByIdSimple(id);
  }

  async delete(id: string, user: User) {
    await this.assertAdmin(id, user.id);
    await this.repo.delete(id);
  }

  async addMember(projectId: string, userId: string, user: User) {
    await this.assertAdmin(projectId, user.id);
    if (userId === user.id) throw new BadRequestException('Нельзя добавить себя');
    const exists = await this.repo.findMember(projectId, userId);
    if (exists) throw new ConflictException('Пользователь уже в проекте');
    return this.repo.addMember(projectId, userId);
  }

  async removeMember(projectId: string, userId: string, user: User) {
    await this.assertAdmin(projectId, user.id);
    await this.repo.removeMember(projectId, userId);
  }

  async getMembers(projectId: string) {
    const members = await this.repo.findMembers(projectId);
    return members.map((m) => m.user);
  }

  private async assertAdmin(projectId: string, userId: string) {
    const project = await this.repo.findByIdSimple(projectId);
    if (!project) throw new NotFoundException('Проект не найден');
    if (project.adminId !== userId) throw new ForbiddenException('Нет прав');
  }
}
