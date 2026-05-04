import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateDeliverableDto {
  @ApiProperty({
    example: 'approved',
    enum: ['approved', 'rejected'],
    required: false,
  })
  @IsOptional()
  @IsIn(['approved', 'rejected'])
  status?: 'approved' | 'rejected';

  @ApiProperty({
    example: 'approve',
    enum: ['approve', 'revision_requested'],
    required: false,
  })
  @IsOptional()
  @IsIn(['approve', 'revision_requested'])
  action?: 'approve' | 'revision_requested';
}
