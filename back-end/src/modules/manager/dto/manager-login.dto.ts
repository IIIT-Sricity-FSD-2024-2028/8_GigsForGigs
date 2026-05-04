import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ManagerLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
