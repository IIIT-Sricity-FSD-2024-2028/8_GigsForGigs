import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// All fields optional for PATCH — only send what changed
export class UpdateUserDto extends PartialType(CreateUserDto) {}
