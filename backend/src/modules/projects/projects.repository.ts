import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly members: Repository<ProjectMember>,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    return this.projects.save(this.projects.create(data));
  }

  async findForUser(userId: string): Promise<Project[]> {
    return this.projects
      .createQueryBuilder('p')
      .leftJoin('p.members', 'pm')
      .where('p.adminId = :userId OR pm.userId = :userId', { userId })
      .distinct(true)
      .getMany();
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.findOne({
      where: { id },
      relations: ['members', 'members.user', 'sprints'],
    });
  }

  async findByIdSimple(id: string): Promise<Project | null> {
    return this.projects.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    await this.projects.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.projects.delete(id);
  }

  async addMember(projectId: string, userId: string): Promise<ProjectMember> {
    return this.members.save(this.members.create({ projectId, userId }));
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.members.delete({ projectId, userId });
  }

  async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.members.findOne({ where: { projectId, userId } });
  }

  async findMembers(projectId: string): Promise<ProjectMember[]> {
    return this.members.find({ where: { projectId }, relations: ['user'] });
  }
}
