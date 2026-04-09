import { IsEmail, IsString } from 'class-validator';

export class CreateManagerDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  // clientId injected from auth context server-side
}
