import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraEpic } from '../jira/entities/jira-epic.entity';
import { EstimateTask } from '../baseline/entities/estimate-task.entity';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JiraEpic, EstimateTask])],
  providers: [LinksService],
  controllers: [LinksController],
})
export class LinksModule {}
