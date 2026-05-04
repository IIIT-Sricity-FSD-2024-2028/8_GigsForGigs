import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ManagerDeliverableDecision {
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
  REJECTED = 'rejected',
}

export class ReviewManagerDeliverableDto {
  @ApiPropertyOptional({
    example: 'approved',
    enum: ManagerDeliverableDecision,
  })
  @IsEnum(ManagerDeliverableDecision)
  @IsOptional()
  decision?: string;

  @ApiPropertyOptional({ example: 'Looks good to proceed.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
