import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  reviewer_id: string;

  @ApiProperty({ example: 'user-456' })
  @IsString()
  @IsNotEmpty()
  reviewee_id: string;

  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  task_id: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great work' })
  @IsString()
  @IsOptional()
  comment?: string;
}
