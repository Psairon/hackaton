import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baseline } from '../baseline/entities/baseline.entity';
import { EstimateTask } from '../baseline/entities/estimate-task.entity';
import { JiraEpic } from '../jira/entities/jira-epic.entity';
import { JiraTask } from '../jira/entities/jira-task.entity';
import { JiraWorklog } from '../jira/entities/jira-worklog.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ControlObjectsModule } from '../control-objects/control-objects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Baseline, EstimateTask, JiraEpic, JiraTask, JiraWorklog]),
    ControlObjectsModule,
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
