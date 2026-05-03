import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  manager_id?: string;
}
