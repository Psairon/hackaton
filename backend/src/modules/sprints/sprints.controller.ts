import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post('projects/:projectId/sprints')
  create(@Param('projectId') projectId: string, @Body() dto: CreateSprintDto) {
    return this.sprintsService.create(projectId, dto);
  }

  @Get('projects/:projectId/sprints')
  findByProject(@Param('projectId') projectId: string) {
    return this.sprintsService.findByProject(projectId);
  }

  @Get('sprints/:id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findById(id);
  }

  @Patch('sprints/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    return this.sprintsService.update(id, dto);
  }

  @Delete('sprints/:id')
  remove(@Param('id') id: string) {
    return this.sprintsService.delete(id);
  }
}
