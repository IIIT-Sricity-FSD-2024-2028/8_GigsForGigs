import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  taskId: string;

  @IsString()
  @IsOptional()
  coverLetter?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  proposedRate?: number;

  // applicantId will be injected from auth context server-side
}
