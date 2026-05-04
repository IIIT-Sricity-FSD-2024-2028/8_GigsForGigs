import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateApplicationDto {
  @ApiProperty({ example: 'shortlisted', enum: ['shortlisted', 'rejected'] })
  @IsIn(['shortlisted', 'rejected'])
  status: 'shortlisted' | 'rejected';
}
