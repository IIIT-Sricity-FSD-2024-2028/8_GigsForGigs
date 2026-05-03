import { IsString, IsNotEmpty, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateDeliverableDto {
  @IsString()
  @IsNotEmpty()
  task_id: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  deliverable_no?: number;

  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
