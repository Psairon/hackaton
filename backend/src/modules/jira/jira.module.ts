import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraEpic } from './entities/jira-epic.entity';
import { JiraTask } from './entities/jira-task.entity';
import { JiraWorklog } from './entities/jira-worklog.entity';
import { JiraRepository } from './jira.repository';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';
import { ControlObjectsModule } from '../control-objects/control-objects.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JiraEpic, JiraTask, JiraWorklog]),
    ControlObjectsModule,
    EmployeesModule,
  ],
  providers: [JiraService, JiraRepository],
  controllers: [JiraController],
  exports: [JiraService],
})
export class JiraModule {}
