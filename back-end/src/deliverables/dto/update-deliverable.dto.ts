import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DeliverableStatus } from '../../common/enums/deliverable-status.enum';

export class UpdateDeliverableDto {
  @IsEnum(DeliverableStatus)
  status: DeliverableStatus;

  @IsString()
  @IsOptional()
  revisionNote?: string;  // required when status = REVISION_REQUESTED
}
