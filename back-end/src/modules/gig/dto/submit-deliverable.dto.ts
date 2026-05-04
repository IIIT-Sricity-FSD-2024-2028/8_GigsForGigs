import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitDeliverableDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
