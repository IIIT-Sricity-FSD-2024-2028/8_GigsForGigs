import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum RequestAction {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export class RespondRequestDto {
  @ApiProperty({ example: RequestAction.ACCEPTED, enum: RequestAction })
  @IsEnum(RequestAction)
  action: RequestAction;
}
