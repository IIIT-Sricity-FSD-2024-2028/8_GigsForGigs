import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateManagerMeDto {
  @ApiPropertyOptional({ example: 'Avery Manager' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'avery.manager@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'StrongPass123!' })
  @IsString()
  @IsOptional()
  password?: string;
}
