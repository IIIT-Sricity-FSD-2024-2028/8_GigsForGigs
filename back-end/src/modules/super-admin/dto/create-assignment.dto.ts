import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  task_id: string;

  @ApiProperty({ example: 'manager-123' })
  @IsString()
  @IsNotEmpty()
  manager_id: string;

  @ApiPropertyOptional({ example: 'client-123' })
  @IsString()
  @IsOptional()
  client_id?: string;
}
