import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../../../common/database/database.types';

export class CreateTaskDto {
  @ApiProperty({ example: 'client-123' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'Logo Design' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Design a logo for the startup launch' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  budget: number;

  @ApiPropertyOptional({ example: 'open', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
