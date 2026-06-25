import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estimate } from './entities/estimate.entity';
import { EstimateItem } from './entities/estimate-item.entity';
import { EstimatesRepository } from './estimates.repository';
import { EstimatesService } from './estimates.service';
import { EstimatesController } from './estimates.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Estimate, EstimateItem]), TasksModule],
  providers: [EstimatesService, EstimatesRepository],
  controllers: [EstimatesController],
  exports: [EstimatesService],
})
export class EstimatesModule {}
