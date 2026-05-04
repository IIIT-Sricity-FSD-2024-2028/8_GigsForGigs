import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
} from 'class-validator';

export class PostServiceDto {
  @ApiProperty({ example: 'Brand Strategy' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Strategic support for product launch' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: ['branding', 'strategy'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
