import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { TaskStatus } from '../../../common/database/database.types';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Landing Page Design v2' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Revised landing page copy' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1250 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: 'in_progress', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
