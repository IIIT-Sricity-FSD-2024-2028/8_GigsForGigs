import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

export class UpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  note?: string;  // optional reason for rejection/revision
}
