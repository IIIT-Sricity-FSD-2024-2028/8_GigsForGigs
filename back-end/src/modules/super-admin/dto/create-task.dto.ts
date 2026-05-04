import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { TaskStatus } from '../../../common/database/database.types';

export class CreateTaskDto {
  @ApiProperty({ example: 'client-123' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'Landing Page Design' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Design landing page visuals' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsPositive()
  budget: number;

  @ApiPropertyOptional({ example: 'open', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
