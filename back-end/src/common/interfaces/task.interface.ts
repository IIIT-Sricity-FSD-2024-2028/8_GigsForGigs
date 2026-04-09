import { TaskStatus } from '../enums/task-status.enum';

export interface ITask {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  duration: string;        // e.g. '3 days', '1 week'
  skills: string[];
  status: TaskStatus;
  clientId: string;
  assignedTo?: string;     // userId of gig professional
  createdAt: Date;
  updatedAt: Date;
}
