import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiContextBuilder } from './ai.context-builder';
import { AiController } from './ai.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  providers: [AiService, AiContextBuilder],
  controllers: [AiController],
})
export class AiModule {}
