import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { BaselineService } from './baseline.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('baseline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BaselineController {
  constructor(private readonly service: BaselineService) {}

  @Post('control-objects/:id/baseline/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  import(
    @Param('id') controlObjectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.import(controlObjectId, file);
  }

  @Get('control-objects/:id/baseline')
  getActive(@Param('id') controlObjectId: string) {
    return this.service.getActive(controlObjectId);
  }

  @Get('control-objects/:id/estimate-tasks')
  getEstimateTasks(@Param('id') controlObjectId: string) {
    return this.service.getEstimateTasks(controlObjectId);
  }

  @Get('estimate-tasks/:id')
  getEstimateTask(@Param('id') id: string) {
    return this.service.getEstimateTask(id);
  }
}
