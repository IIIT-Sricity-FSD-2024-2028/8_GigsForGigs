import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthSignupDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'client', enum: ['client', 'gig', 'manager'] })
  @IsString()
  @IsIn(['client', 'gig', 'manager'])
  role: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  client_id?: string;
}
