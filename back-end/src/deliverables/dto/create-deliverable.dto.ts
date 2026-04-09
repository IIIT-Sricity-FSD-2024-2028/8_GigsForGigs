import { IsString, IsOptional } from 'class-validator';

export class CreateDeliverableDto {
  @IsString()
  taskId: string;

  @IsString()
  description: string;

  @IsString()
  submissionPath: string;

  // submittedBy injected from auth context server-side
}
