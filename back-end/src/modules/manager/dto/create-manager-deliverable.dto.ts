import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateManagerDeliverableDto {
  @ApiProperty({ example: 'gig-profile-123', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gig_profile_id?: string;

  @ApiProperty({ example: 'Deliverable content', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ example: 'Deliverable content' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  assignedGigId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  deliverable_no?: number;
}
