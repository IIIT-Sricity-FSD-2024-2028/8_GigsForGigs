import { TaskStatus } from '../../../common/database/database.types';

export class CreateTaskDto {
  client_id: string;
  title: string;
  description: string;
  budget: number;
  status?: TaskStatus;
}
