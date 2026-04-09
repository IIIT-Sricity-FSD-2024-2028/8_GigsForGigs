import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsString()
  taskId: string;

  @IsString()
  deliverableId: string;

  @IsString()
  payeeId: string;  // gig professional

  @IsNumber()
  @Min(0)
  amount: number;

  // payerId injected from auth context
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionRef?: string;
}
