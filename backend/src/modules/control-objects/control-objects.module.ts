import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlObject } from './entities/control-object.entity';
import { ControlObjectsRepository } from './control-objects.repository';
import { ControlObjectsService } from './control-objects.service';
import { ControlObjectsController } from './control-objects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ControlObject])],
  providers: [ControlObjectsService, ControlObjectsRepository],
  controllers: [ControlObjectsController],
  exports: [ControlObjectsService],
})
export class ControlObjectsModule {}
