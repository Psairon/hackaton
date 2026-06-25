import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baseline } from './entities/baseline.entity';
import { EstimateTask } from './entities/estimate-task.entity';
import { EstimateTaskHours } from './entities/estimate-task-hours.entity';
import { BaselineRepository } from './baseline.repository';
import { BaselineService } from './baseline.service';
import { BaselineController } from './baseline.controller';
import { ControlObjectsModule } from '../control-objects/control-objects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Baseline, EstimateTask, EstimateTaskHours]),
    ControlObjectsModule,
  ],
  providers: [BaselineService, BaselineRepository],
  controllers: [BaselineController],
  exports: [BaselineService],
})
export class BaselineModule {}
