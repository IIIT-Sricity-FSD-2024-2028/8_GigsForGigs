import { IsString, IsNotEmpty } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @IsString()
  @IsNotEmpty()
  task_id: string;
}
