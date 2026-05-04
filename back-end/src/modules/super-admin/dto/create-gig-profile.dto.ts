import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGigProfileDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
