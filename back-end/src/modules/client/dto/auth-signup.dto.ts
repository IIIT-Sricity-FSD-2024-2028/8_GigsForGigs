import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthSignupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsIn(['client', 'gig', 'manager'])
  role: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  client_id?: string;
}
