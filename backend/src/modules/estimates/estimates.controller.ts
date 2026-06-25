import {
  Controller, Get, Post, Delete,
  Param, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('estimates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post('sprints/:sprintId/estimates/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importEstimates(@Param('sprintId') sprintId: string, @UploadedFile() file: Express.Multer.File) {
    return this.estimatesService.importStub(sprintId, file);
  }

  @Get('sprints/:sprintId/estimates')
  findBySprint(@Param('sprintId') sprintId: string) {
    return this.estimatesService.findBySprint(sprintId);
  }

  @Get('estimates/:id')
  findOne(@Param('id') id: string) {
    return this.estimatesService.findById(id);
  }

  @Post('estimate-items/:itemId/link/:taskId')
  linkTask(@Param('itemId') itemId: string, @Param('taskId') taskId: string) {
    return this.estimatesService.linkTask(itemId, taskId);
  }

  @Delete('estimate-items/:itemId/link')
  unlinkTask(@Param('itemId') itemId: string) {
    return this.estimatesService.unlinkTask(itemId);
  }
}
