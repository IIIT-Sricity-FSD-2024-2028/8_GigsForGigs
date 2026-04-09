import { IsString, IsArray, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsUrl()
  @IsOptional()
  portfolioUrl?: string;

  @IsString()
  @IsOptional()
  referredBy?: string;

  @IsString()
  @IsOptional()
  clientId?: string;  // for managers
}
