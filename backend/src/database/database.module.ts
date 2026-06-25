import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { ProjectMember } from '../modules/projects/entities/project-member.entity';
import { Sprint } from '../modules/sprints/entities/sprint.entity';
import { Task } from '../modules/tasks/entities/task.entity';
import { Estimate } from '../modules/estimates/entities/estimate.entity';
import { EstimateItem } from '../modules/estimates/entities/estimate-item.entity';
import { ControlObject } from '../modules/control-objects/entities/control-object.entity';
import { Baseline } from '../modules/baseline/entities/baseline.entity';
import { EstimateTask } from '../modules/baseline/entities/estimate-task.entity';
import { EstimateTaskHours } from '../modules/baseline/entities/estimate-task-hours.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User,
          Project,
          ProjectMember,
          Sprint,
          Task,
          Estimate,
          EstimateItem,
          ControlObject,
          Baseline,
          EstimateTask,
          EstimateTaskHours,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
