<<<<<<< HEAD
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
=======
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
>>>>>>> caa7868cb617e31b5f661fece23f697ab1c3f263

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
