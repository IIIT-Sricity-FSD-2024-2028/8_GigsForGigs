import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateDeliverableDto {
  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  task_id: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  deliverable_no?: number;

  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @ApiProperty({ example: 'Deliverable content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
