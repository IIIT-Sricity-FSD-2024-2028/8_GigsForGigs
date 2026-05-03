import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @IsString()
  @IsNotEmpty()
  task_id: string;

  @IsString()
  @IsNotEmpty()
  manager_id: string;

  @IsString()
  @IsOptional()
  client_id?: string;
}
