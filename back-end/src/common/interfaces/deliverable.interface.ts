import { DeliverableStatus } from '../enums/deliverable-status.enum';

export interface IDeliverable {
  id: string;
  taskId: string;
  submittedBy: string;     // gig professional userId
  message: string;
  fileUrls: string[];
  status: DeliverableStatus;
  revisionNote?: string;
  paymentReleased: boolean;
  submittedAt: Date;
  updatedAt: Date;
}
