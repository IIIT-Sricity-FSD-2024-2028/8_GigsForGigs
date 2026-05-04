import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @ApiProperty({ example: 'manager-123' })
  @IsString()
  @IsNotEmpty()
  manager_id: string;
}
