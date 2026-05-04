import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  task_id: string;

  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  gig_profile_id: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @IsPositive()
  amount: number;
}
