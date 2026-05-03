import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGigProfileDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
