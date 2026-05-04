import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Experienced designer and strategist' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: ['branding', 'copywriting'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ example: ['Figma', 'Notion'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];

  @ApiPropertyOptional({ example: ['https://portfolio.example.com'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  portfolio?: string[];
}
