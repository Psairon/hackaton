import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './entities/sprint.entity';
import { SprintsRepository } from './sprints.repository';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint])],
  providers: [SprintsService, SprintsRepository],
  controllers: [SprintsController],
  exports: [SprintsService],
})
export class SprintsModule {}
