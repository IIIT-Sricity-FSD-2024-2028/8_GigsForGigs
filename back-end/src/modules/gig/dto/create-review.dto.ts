import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'task-123' })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ example: 'gig-profile-123' })
  @IsString()
  @IsNotEmpty()
  revieweeId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent work' })
  @IsString()
  @IsOptional()
  comment?: string;
}
