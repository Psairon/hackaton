import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('control-objects/:id')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@Param('id') id: string) {
    return this.service.dashboard(id);
  }

  @Get('comparison')
  comparison(@Param('id') id: string) {
    return this.service.comparison(id);
  }

  @Get('risks')
  risks(@Param('id') id: string) {
    return this.service.risks(id);
  }

  @Get('data-quality')
  dataQuality(@Param('id') id: string) {
    return this.service.dataQuality(id);
  }
}
