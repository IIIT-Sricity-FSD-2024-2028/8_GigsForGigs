import { prisma } from 'db';
import type { PaymentRecord, FinancialCalculationResult, SuperAdminRevenueMetrics } from './payment.types.js';
import { PaymentStatus } from './payment.types.js';

export class PaymentService {
  private static DEFAULT_PLATFORM_FEE_RATE = 0.07; // Dynamic 7% platform fee

  /**
   * Calculate financial totals on the server with dynamic 7% platform fee.
   */
  public static calculateFinancials(gigAmount: number, overrideFee?: number): FinancialCalculationResult & { gigPayout: number; platformRevenue: number } {
    const platformFee = typeof overrideFee === 'number' ? overrideFee : Math.round(gigAmount * this.DEFAULT_PLATFORM_FEE_RATE);
    const totalAmount = gigAmount + platformFee;
    return {
      gigAmount,
      platformFee,
      totalAmount,
      gigPayout: gigAmount,
      platformRevenue: platformFee
    };
  }

  /**
   * Validate payment status transitions to prevent illegal state jumps.
   */
  public static validateStatusTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.PAYMENT_PROCESSING, PaymentStatus.CANCELLED, PaymentStatus.ESCROWED],
      [PaymentStatus.PAYMENT_PROCESSING]: [PaymentStatus.ESCROWED, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
      [PaymentStatus.ESCROWED]: [PaymentStatus.WORK_SUBMITTED, PaymentStatus.AWAITING_APPROVAL, PaymentStatus.DISPUTED, PaymentStatus.CANCELLED],
      [PaymentStatus.WORK_SUBMITTED]: [PaymentStatus.AWAITING_APPROVAL, PaymentStatus.RELEASE_APPROVED, PaymentStatus.DISPUTED],
      [PaymentStatus.AWAITING_APPROVAL]: [PaymentStatus.RELEASE_APPROVED, PaymentStatus.RELEASED, PaymentStatus.COMPLETED, PaymentStatus.DISPUTED],
      [PaymentStatus.RELEASE_APPROVED]: [PaymentStatus.RELEASED, PaymentStatus.COMPLETED],
      [PaymentStatus.RELEASED]: [PaymentStatus.COMPLETED],
      [PaymentStatus.COMPLETED]: [],
      [PaymentStatus.CANCELLED]: [],
      [PaymentStatus.REFUNDED]: [],
      [PaymentStatus.DISPUTED]: [PaymentStatus.RELEASED, PaymentStatus.REFUNDED, PaymentStatus.COMPLETED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING]
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Save or update payment in PostgreSQL database via Prisma.
   */
  public static async persistPayment(taskId: number, gigProfileId: number, gigAmount: number, status: 'pending' | 'completed' = 'pending') {
    return await prisma.payment.upsert({
      where: { taskId_gigProfileId: { taskId, gigProfileId } },
      update: { amount: gigAmount, status },
      create: { taskId, gigProfileId, amount: gigAmount, status },
      include: { task: true, gigProfile: { include: { user: true } } }
    });
  }

  /**
   * Get payment by taskId from PostgreSQL.
   */
  public static async getPaymentByTaskId(taskId: number) {
    return await prisma.payment.findFirst({
      where: { taskId },
      include: { task: true, gigProfile: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all payments for tasks owned by a client from PostgreSQL.
   */
  /**
   * Get all payments for tasks owned by a client from PostgreSQL.
   * Uses raw SQL with status::text to prevent Prisma P2023 enum mismatches on 'held' escrow status.
   */
  public static async getClientPayments(clientId: number) {
    const rawPayments: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        p.payment_id as "paymentId",
        p.task_id as "taskId",
        p.gig_profile_id as "gigProfileId",
        p.amount,
        p.status::text as "status",
        p.created_at as "createdAt",
        t.title as "taskTitle",
        t.status as "taskStatus",
        t.budget as "taskBudget",
        u.name as "gigProName"
      FROM "PAYMENT" p
      JOIN "TASKS" t ON p.task_id = t.task_id
      LEFT JOIN "GIG_PROFESSIONAL_PROFILE" gp ON p.gig_profile_id = gp.gig_profile_id
      LEFT JOIN "USERS" u ON gp.user_id = u.user_id
      WHERE t.client_id = $1
      ORDER BY p.created_at DESC
    `, clientId);

    const existingTaskKeys = new Set(rawPayments.map(p => `${p.taskId}_${p.gigProfileId}`));
    const existingTaskIds = new Set(rawPayments.map(p => String(p.taskId)));

    // Include accepted applications for client tasks that do not yet have a payment row
    const acceptedApps: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        a.task_id as "taskId",
        a.gig_profile_id as "gigProfileId",
        a.created_at as "createdAt",
        t.title as "taskTitle",
        t.status as "taskStatus",
        t.budget as "taskBudget",
        u.name as "gigProName"
      FROM "APPLICATION" a
      JOIN "TASKS" t ON a.task_id = t.task_id
      LEFT JOIN "GIG_PROFESSIONAL_PROFILE" gp ON a.gig_profile_id = gp.gig_profile_id
      LEFT JOIN "USERS" u ON gp.user_id = u.user_id
      WHERE a.status = 'accepted' AND t.client_id = $1
      ORDER BY a.created_at DESC
    `, clientId);

    for (const app of acceptedApps) {
      const key = `${app.taskId}_${app.gigProfileId}`;
      if (!existingTaskKeys.has(key)) {
        rawPayments.push({
          paymentId: `T${app.taskId}`,
          taskId: app.taskId,
          gigProfileId: app.gigProfileId,
          amount: app.taskBudget,
          status: app.taskStatus === 'completed' ? 'completed' : 'pending',
          createdAt: app.createdAt,
          taskTitle: app.taskTitle,
          taskStatus: app.taskStatus,
          taskBudget: app.taskBudget,
          gigProName: app.gigProName || 'Gig Professional',
        });
        existingTaskKeys.add(key);
        existingTaskIds.add(String(app.taskId));
      }
    }

    // Also ensure completed tasks owned by client appear in the ledger
    const completedTasks: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        t.task_id as "taskId",
        t.title as "taskTitle",
        t.status as "taskStatus",
        t.budget as "taskBudget",
        t.created_at as "createdAt"
      FROM "TASKS" t
      WHERE t.status = 'completed' AND t.client_id = $1
      ORDER BY t.created_at DESC
    `, clientId);

    for (const ct of completedTasks) {
      if (!existingTaskIds.has(String(ct.taskId))) {
        rawPayments.push({
          paymentId: `T${ct.taskId}`,
          taskId: ct.taskId,
          gigProfileId: null,
          amount: ct.taskBudget,
          status: 'completed',
          createdAt: ct.createdAt,
          taskTitle: ct.taskTitle,
          taskStatus: ct.taskStatus,
          taskBudget: ct.taskBudget,
          gigProName: 'Gig Professional',
        });
        existingTaskIds.add(String(ct.taskId));
      }
    }

    return rawPayments;
  }

  /**
   * Release payment and mark Task as completed in PostgreSQL.
   */
  public static async releasePaymentInDb(taskId: number, gigProfileId: number, gigAmount?: number) {
    const amount = gigAmount && gigAmount > 0 ? gigAmount : 5000;
    return await prisma.$transaction([
      prisma.payment.upsert({
        where: { taskId_gigProfileId: { taskId, gigProfileId } },
        update: { status: 'completed', ...(gigAmount ? { amount: gigAmount } : {}) },
        create: { taskId, gigProfileId, amount, status: 'completed' }
      }),
      prisma.task.update({
        where: { taskId },
        data: { status: 'completed' }
      })
    ]);
  }

  /**
   * Compute platform-wide revenue and escrow metrics for Super Admin.
   */
  public static computeMetrics(records: PaymentRecord[]): SuperAdminRevenueMetrics {
    let totalPlatformRevenue = 0;
    let platformFeesCollected = 0;
    let platformFeesPendingRelease = 0;
    let totalEscrowFunds = 0;
    let totalGigPayouts = 0;
    let completedTransactionsCount = 0;
    let disputedPaymentsCount = 0;
    let refundedPaymentsCount = 0;

    for (const record of records) {
      if (record.status === PaymentStatus.COMPLETED || record.status === PaymentStatus.RELEASED) {
        totalPlatformRevenue += record.platformFee;
        platformFeesCollected += record.platformFee;
        totalGigPayouts += record.gigAmount;
        completedTransactionsCount += 1;
      } else if (record.status === PaymentStatus.ESCROWED || record.status === PaymentStatus.WORK_SUBMITTED || record.status === PaymentStatus.AWAITING_APPROVAL) {
        totalEscrowFunds += record.gigAmount;
        platformFeesPendingRelease += record.platformFee;
      } else if (record.status === PaymentStatus.DISPUTED) {
        totalEscrowFunds += record.gigAmount;
        disputedPaymentsCount += 1;
      } else if (record.status === PaymentStatus.REFUNDED) {
        refundedPaymentsCount += 1;
      }
    }

    return {
      totalPlatformRevenue,
      platformFeesCollected,
      platformFeesPendingRelease,
      totalEscrowFunds,
      totalGigPayouts,
      completedTransactionsCount,
      disputedPaymentsCount,
      refundedPaymentsCount
    };
  }
}
