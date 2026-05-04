import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/database/database.types';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane.admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'CLIENT', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
