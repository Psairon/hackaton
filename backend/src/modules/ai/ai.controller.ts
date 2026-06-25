import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** AI-сводка объекта контроля: состояние, риски, вопросы, рекомендации, объяснения (FR-20–25). */
  @Post('control-objects/:id/ai/summary')
  summary(@Param('id') id: string) {
    return this.aiService.summary(id);
  }
}
