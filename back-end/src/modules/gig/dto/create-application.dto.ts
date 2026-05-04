import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
