import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sprint/:id/summary')
  summary(@Param('id') id: string) {
    return this.aiService.sprintSummary(id);
  }

  @Post('sprint/:id/risks')
  risks(@Param('id') id: string) {
    return this.aiService.sprintRisks(id);
  }
}
