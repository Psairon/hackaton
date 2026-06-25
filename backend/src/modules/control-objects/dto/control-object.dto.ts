import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ControlObjectType } from '../entities/control-object.entity';

export class CreateControlObjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ControlObjectType })
  @IsEnum(ControlObjectType)
  @IsOptional()
  type?: ControlObjectType;

  @ApiPropertyOptional({ description: 'Ответственный PM/Team Lead' })
  @IsUUID()
  @IsOptional()
  responsibleId?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsDateString()
  @IsOptional()
  plannedEndDate?: string;
}

export class UpdateControlObjectDto extends PartialType(CreateControlObjectDto) {}
