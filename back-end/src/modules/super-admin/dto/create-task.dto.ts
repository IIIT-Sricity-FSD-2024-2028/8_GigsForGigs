import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../../../common/database/database.types';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  budget: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
