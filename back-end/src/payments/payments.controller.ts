import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments
   * Initiate a payment / lock funds into escrow after task assignment
   */
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  /**
   * GET /payments
   * List payments; filter by taskId, payerId, payeeId, status
   */
  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('payerId') payerId?: string,
    @Query('payeeId') payeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll({ taskId, payerId, payeeId, status });
  }

  /**
   * GET /payments/summary
   * Revenue summary for super-admin dashboard
   */
  @Get('summary')
  getSummary() {
    return this.paymentsService.getSummary();
  }

  /**
   * GET /payments/:id
   * Get a single payment record
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  /**
   * PATCH /payments/:id/release
   * Release escrowed funds to gig professional after deliverable approval
   */
  @Patch(':id/release')
  release(@Param('id') id: string) {
    return this.paymentsService.release(id);
  }

  /**
   * PATCH /payments/:id/refund
   * Refund payment to client (e.g. cancellation or dispute)
   */
  @Patch(':id/refund')
  refund(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentsService.refund(id, reason);
  }

  /**
   * PATCH /payments/:id/status
   * Update payment status (generic, for admin use)
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(id, dto);
  }
}
