import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ControlObjectsService } from './control-objects.service';
import {
  CreateControlObjectDto,
  UpdateControlObjectDto,
} from './dto/control-object.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('control-objects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ControlObjectsController {
  constructor(private readonly service: ControlObjectsService) {}

  @Post('projects/:projectId/control-objects')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateControlObjectDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Get('projects/:projectId/control-objects')
  findByProject(@Param('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get('control-objects/:id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch('control-objects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateControlObjectDto) {
    return this.service.update(id, dto);
  }

  @Delete('control-objects/:id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
