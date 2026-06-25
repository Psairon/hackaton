import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JiraService } from './jira.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('jira')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class JiraController {
  constructor(private readonly service: JiraService) {}

  /** Импорт Jira-выгрузки: файл структуры + файл трудозатрат + ключ поставки. */
  @Post('control-objects/:id/jira/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'structureFile', maxCount: 1 },
      { name: 'worklogFile', maxCount: 1 },
    ]),
  )
  import(
    @Param('id') controlObjectId: string,
    @Body('deliveryKey') deliveryKey: string,
    @UploadedFiles()
    files: {
      structureFile?: Express.Multer.File[];
      worklogFile?: Express.Multer.File[];
    },
  ) {
    const structure = files?.structureFile?.[0];
    const worklog = files?.worklogFile?.[0];
    if (!structure || !worklog) {
      throw new BadRequestException('Нужны оба файла: structureFile и worklogFile');
    }
    return this.service.import(controlObjectId, deliveryKey, structure, worklog);
  }

  @Get('control-objects/:id/jira/epics')
  getEpics(@Param('id') controlObjectId: string) {
    return this.service.getEpics(controlObjectId);
  }

  @Get('control-objects/:id/jira/tasks')
  getTasks(@Param('id') controlObjectId: string) {
    return this.service.getTasks(controlObjectId);
  }
}
