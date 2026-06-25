import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { SprintStatus } from '../entities/sprint.entity';

export class CreateSprintDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SprintStatus })
  @IsEnum(SprintStatus)
  status: SprintStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateSprintDto extends PartialType(CreateSprintDto) {}
