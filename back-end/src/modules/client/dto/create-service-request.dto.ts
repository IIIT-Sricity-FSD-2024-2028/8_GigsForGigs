import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'client-123' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'Brand Strategy' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Need brand positioning support' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsNotEmpty()
  budget: number;
}
