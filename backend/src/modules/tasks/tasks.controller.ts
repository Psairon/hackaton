import {
  Controller, Get, Patch, Delete, Post,
  Param, Body, Query, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { UpdateTaskDto, TaskFilterDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('sprints/:sprintId/tasks')
  findTree(@Param('sprintId') sprintId: string, @Query() filters: TaskFilterDto) {
    return this.tasksService.findTree(sprintId, filters);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete('tasks/:id')
  remove(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Post('sprints/:sprintId/tasks/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importTasks(@Param('sprintId') sprintId: string, @UploadedFile() file: Express.Multer.File) {
    return this.tasksService.importStub(sprintId, file);
  }
}
