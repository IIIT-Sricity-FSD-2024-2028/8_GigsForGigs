import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateManagerInviteDto {
  @ApiProperty({ example: 'client-123' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'Alex Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'alex.manager@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'manager-123' })
  @IsString()
  @IsOptional()
  manager_id?: string;
}
