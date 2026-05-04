import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../../../common/database/database.types';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'client-123' })
  @IsString()
  @IsOptional()
  client_id?: string;

  @ApiPropertyOptional({ example: 'Updated Logo Design' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 750 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: 'in_progress', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
