import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateApplicationDto {
  @ApiProperty({
    example: 'accepted',
    enum: ['accepted', 'rejected', 'shortlisted'],
  })
  @IsIn(['accepted', 'rejected', 'shortlisted'])
  status: 'accepted' | 'rejected' | 'shortlisted';
}
