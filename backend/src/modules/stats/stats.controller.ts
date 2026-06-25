import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('sprints/:id/stats/tasks')
  sprintTaskStats(@Param('id') id: string) {
    return this.statsService.sprintTaskStats(id);
  }

  @Get('sprints/:id/stats/departments')
  sprintDepartmentStats(@Param('id') id: string) {
    return this.statsService.sprintDepartmentStats(id);
  }

  @Get('sprints/:id/stats/estimates')
  sprintEstimateStats(@Param('id') id: string) {
    return this.statsService.sprintEstimateStats(id);
  }

  @Get('projects/:id/stats/overview')
  projectOverview(@Param('id') id: string) {
    return this.statsService.projectOverview(id);
  }
}
