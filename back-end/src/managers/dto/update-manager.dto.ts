import { IsString, IsOptional } from 'class-validator';

export class UpdateManagerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
