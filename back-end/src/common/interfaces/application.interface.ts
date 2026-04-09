import { ApplicationStatus } from '../enums/application-status.enum';

export interface IApplication {
  id: string;
  taskId: string;
  applicantId: string;     // gig professional userId
  coverLetter?: string;
  proposedRate?: number;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}
