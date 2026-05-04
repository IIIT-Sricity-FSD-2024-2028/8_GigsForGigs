import { IsEnum } from 'class-validator';

export enum RequestAction {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export class RespondRequestDto {
  @IsEnum(RequestAction)
  action: RequestAction;
}
