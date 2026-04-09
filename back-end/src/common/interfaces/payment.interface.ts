import { PaymentStatus } from '../enums/payment-status.enum';

export interface IPayment {
  id: string;
  taskId: string;
  deliverableId: string;
  payerId: string;         // clientId
  payeeId: string;         // gig professional userId
  amount: number;
  platformFee: number;
  netAmount: number;
  status: PaymentStatus;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}
