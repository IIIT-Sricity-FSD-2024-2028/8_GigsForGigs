import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  task_id: string;
}
