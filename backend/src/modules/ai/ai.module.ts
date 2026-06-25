import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [StatsModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
