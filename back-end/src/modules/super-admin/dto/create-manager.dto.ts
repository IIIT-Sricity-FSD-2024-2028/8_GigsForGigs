import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateManagerDto {
  @ApiProperty({ example: 'client-123' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'user-456' })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiPropertyOptional({ example: 'manager-789' })
  @IsString()
  @IsOptional()
  manager_id?: string;
}
