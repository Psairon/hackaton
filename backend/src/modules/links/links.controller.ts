import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Post('estimate-tasks/:id/epics/:epicId/link')
  link(@Param('id') id: string, @Param('epicId') epicId: string) {
    return this.service.link(id, epicId);
  }

  @Delete('estimate-tasks/:id/epics/:epicId/link')
  unlink(@Param('id') id: string, @Param('epicId') epicId: string) {
    return this.service.unlink(id, epicId);
  }

  @Post('control-objects/:id/auto-link')
  autoLink(@Param('id') id: string) {
    return this.service.autoLink(id);
  }
}
