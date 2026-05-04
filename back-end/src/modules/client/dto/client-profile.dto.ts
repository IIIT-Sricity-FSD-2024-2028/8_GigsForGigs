import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClientProfileDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  companyName?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  industry?: string;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  website?: string;

  @ApiPropertyOptional({ example: '250-500' })
  companySize?: string;

  @ApiPropertyOptional({ example: 2015 })
  founded?: number;

  @ApiPropertyOptional({ example: 'We build modern products.' })
  description?: string;
}
