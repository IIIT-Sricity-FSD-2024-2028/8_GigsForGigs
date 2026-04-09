import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(1)
  budget: number;

  @IsDateString()
  dueDate: string;  // e.g. '2026-10-31'

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;  // defaults to OPEN in service

  @IsString()
  @IsOptional()
  clientId?: string;   // set server-side from auth context
}
