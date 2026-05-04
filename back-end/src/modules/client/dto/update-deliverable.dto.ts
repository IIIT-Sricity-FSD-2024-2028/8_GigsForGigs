import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateDeliverableDto {
  @ApiProperty({ example: 'approve', enum: ['approve', 'revision_requested'] })
  @IsIn(['approve', 'revision_requested'])
  action: 'approve' | 'revision_requested';
}
