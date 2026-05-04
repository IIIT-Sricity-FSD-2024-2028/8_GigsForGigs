import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitDeliverableDto {
  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ example: 'https://storage.example.com/deliverable.pdf' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'Final version with revisions applied' })
  @IsString()
  @IsOptional()
  notes?: string;
}
