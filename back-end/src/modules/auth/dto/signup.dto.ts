import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SignupDto {
	@ApiProperty({ example: 'Jane Doe' })
	@IsString()
	@IsNotEmpty()
	name!: string;

	@ApiProperty({ example: 'jane@example.com' })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: 'StrongPass123!' })
	@IsString()
	@IsNotEmpty()
	password!: string;

	@ApiProperty({ example: 'client', enum: ['client', 'gig', 'manager'] })
	@IsString()
	@IsIn(['client', 'gig', 'manager'])
	role!: string;
}
