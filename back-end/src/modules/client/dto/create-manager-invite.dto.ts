export class CreateManagerInviteDto {
  client_id: string;
  name: string;
  email: string;
  password: string;
  manager_id?: string;
}
