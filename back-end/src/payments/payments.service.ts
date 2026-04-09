import { Injectable } from '@nestjs/common';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';

/**
 * PaymentsService — stub implementation.
 */
@Injectable()
export class PaymentsService {
  create(dto: CreatePaymentDto) {
    // TODO: calculate platform fee, create escrow record, lock funds
    const platformFee = dto.amount * 0.1; // 10% platform fee placeholder
    return {
      message: 'Payment initiated — funds held in escrow',
      stub: true,
      data: {
        ...dto,
        platformFee,
        netAmount: dto.amount - platformFee,
        status: PaymentStatus.PENDING,
        id: 'stub-payment-id',
      },
    };
  }

  findAll(filters: {
    taskId?: string;
    payerId?: string;
    payeeId?: string;
    status?: string;
  }) {
    return { message: 'All payments', stub: true, filters, data: [] };
  }

  getSummary() {
    // TODO: aggregate total revenue, platform fees, released/pending amounts
    return {
      message: 'Payment summary',
      stub: true,
      data: {
        totalRevenue: 0,
        totalPlatformFees: 0,
        totalReleased: 0,
        totalPending: 0,
        totalRefunded: 0,
      },
    };
  }

  findOne(id: string) {
    return { message: `Payment ${id}`, stub: true, data: { id } };
  }

  release(id: string) {
    // TODO: verify deliverable approved, transfer net amount to payee
    return {
      message: `Payment ${id} released to gig professional`,
      stub: true,
      data: { status: PaymentStatus.COMPLETED },
    };
  }

  refund(id: string, reason?: string) {
    // TODO: verify eligible for refund, return funds to payer
    return {
      message: `Payment ${id} refunded`,
      stub: true,
      data: { status: PaymentStatus.FAILED, reason },
    };
  }

  updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    return {
      message: `Payment ${id} status updated`,
      stub: true,
      data: dto,
    };
  }
}
