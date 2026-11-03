/**
 * Simulated escrow. Client pays gig amount + platform fee at hire time
 * (pending -> held); on release the gig amount goes to the pro and the fee
 * stays with the platform (held -> completed). No gateway is involved.
 *
 * Every transition out of 'held' is a conditional update inside a transaction,
 * so a double click, a racing admin, or a client releasing during arbitration
 * can move the money at most once.
 */
import { prisma } from 'db';
import { conflict, notFound } from '../../lib/httpError.js';
import { isTaskWorkComplete } from '../../lib/taskRules.js';
import { getPlatformSettings } from '../admin/platformSettings.js';

/**
 * Fee in rupees, rounded to paise so it matches the DECIMAL(10,2) column. The
 * result is stored on the PAYMENT row at hire time, so changing the platform
 * rake never retroactively reprices a contract already agreed.
 */
export function platformFeeFor(amount: number, ratePercent = 10): number {
  return Math.round(amount * ratePercent) / 100;
}

/** Money is compared in whole paise to avoid floating point residue. */
const toPaise = (rupees: number) => Math.round(rupees * 100);

/**
 * Divides an escrow between the parties. The client gets their percentage of
 * everything they paid in, and the platform keeps the fee only on the share the
 * pro actually earned (no commission on money handed back). The payout is what
 * remains, so client + pro + platform always equals the amount escrowed, to the paisa.
 */
export function splitEscrow(amount: number, platformFee: number, clientPercent: number) {
  const totalPaise = toPaise(amount) + toPaise(platformFee);
  const refund = Math.round((totalPaise * clientPercent) / 100);
  const retainedFee = Math.round((toPaise(platformFee) * (100 - clientPercent)) / 100);
  return {
    refundToClient: refund / 100,
    platformFee: retainedFee / 100,
    payoutToPro: (totalPaise - refund - retainedFee) / 100,
  };
}

export type EscrowRuling = 'FULL_REFUND' | 'FULL_RELEASE' | 'SPLIT';

/**
 * 409 while a docket is open: during arbitration only the ruling may move this money.
 * ponytail: task-wide, so a dispute with one hire also freezes the task's other hires; scope by party if disputes become common.
 */
export async function assertNoOpenDispute(taskId: number): Promise<void> {
  const open = await prisma.dispute.count({ where: { taskId, status: { in: ['OPEN', 'UNDER_REVIEW'] } } });
  if (open > 0) throw conflict('This task has an open dispute. Escrow can only be moved by its arbitration ruling.');
}

/** The client's own task plus one hired professional's payment row. */
async function requireOwnedContract(clientId: number, taskId: number, gigProfileId: number) {
  const task = await prisma.task.findFirst({
    where: { taskId, clientId },
    include: { applications: { where: { status: 'accepted', gigProfileId } }, payments: { where: { gigProfileId } } },
  });
  if (!task) throw notFound('Task not found');
  const hired = task.applications[0];
  const payment = task.payments[0];
  if (!hired || !payment) throw conflict('This professional has not been hired for this task');
  return { task, hired, payment };
}

/** Client funds the task: pending -> held. Conditional update so a double click can't pay twice. */
export async function payForTask(clientId: number, taskId: number, gigProfileId: number): Promise<void> {
  const { hired, payment } = await requireOwnedContract(clientId, taskId, gigProfileId);
  const { maxEscrowThreshold } = await getPlatformSettings();
  if (Number(payment.amount) + Number(payment.platformFee) > maxEscrowThreshold) {
    throw conflict(`This contract exceeds the platform's maximum escrow of ₹${maxEscrowThreshold.toLocaleString('en-IN')}`);
  }
  const moved = await prisma.payment.updateMany({
    where: { taskId, gigProfileId: hired.gigProfileId, status: 'pending' },
    data: { status: 'held' },
  });
  if (moved.count !== 1) throw conflict('This task has already been funded');
}

/** Client releases escrow to one pro: held -> completed, which finishes that hire. The task posting stays as it is. */
export async function releaseForTask(clientId: number, taskId: number, gigProfileId: number): Promise<void> {
  const { hired, payment } = await requireOwnedContract(clientId, taskId, gigProfileId);
  if (payment.status === 'pending') throw conflict('Fund the task before releasing payment');
  if (payment.status !== 'held') {
    throw conflict('Payment for this task has already been released');
  }
  await assertNoOpenDispute(taskId);
  if (!(await isTaskWorkComplete(taskId, gigProfileId))) {
    throw conflict('All required deliverables must be approved before payment can be released');
  }
  await releasePayment(taskId, hired.gigProfileId);
}

/** Release to the pro: held -> completed. */
export async function releasePayment(taskId: number, gigProfileId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const moved = await tx.payment.updateMany({
      where: { taskId, gigProfileId, status: 'held' },
      data: { status: 'completed', settledAt: new Date() },
    });
    if (moved.count !== 1) throw conflict('Payment is not in escrow');
  });
}

/** Admin refund: held -> refunded. */
export async function refundPayment(taskId: number, gigProfileId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const moved = await tx.payment.updateMany({
      where: { taskId, gigProfileId, status: 'held' },
      data: { status: 'refunded', settledAt: new Date() },
    });
    if (moved.count !== 1) throw conflict('Payment is not in escrow');
  });
}

/**
 * Applies a binding arbitration ruling to a task's held payment and closes the
 * docket in one transaction: the money and the verdict commit together or not
 * at all. Both updates are conditional, so a ruling can execute only once.
 *
 * On a split, the row is rewritten to the amounts actually paid out, so every
 * revenue aggregate over amount and platformFee stays correct with no special
 * case. The original escrow total is preserved in the audit trail.
 */
export async function settleDisputedEscrow(
  disputeId: number,
  taskId: number,
  ruling: EscrowRuling,
  clientPercent: number,
  resolutionNotes: string,
) {
  return prisma.$transaction(async (tx) => {
    const closed = await tx.dispute.updateMany({
      where: { disputeId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      data: { status: 'RESOLVED', settlementType: ruling, resolutionNotes, splitPercent: ruling === 'SPLIT' ? clientPercent : null },
    });
    if (closed.count !== 1) throw conflict('This dispute has already been resolved');

    // The docket's parties identify which hire on the task is in dispute.
    const dispute = await tx.dispute.findUniqueOrThrow({ where: { disputeId } });
    const held = await tx.payment.findFirst({
      where: { taskId, status: 'held', gigProfile: { userId: { in: [dispute.filedByUserId, dispute.againstUserId] } } },
    });
    if (!held) throw conflict('No funds are held in escrow for this task, so the ruling cannot execute');

    const amount = Number(held.amount);
    const fee = Number(held.platformFee);
    const outcome =
      ruling === 'FULL_REFUND' ? { refundToClient: amount + fee, payoutToPro: 0, platformFee: 0 }
      : ruling === 'FULL_RELEASE' ? { refundToClient: 0, payoutToPro: amount, platformFee: fee }
      : splitEscrow(amount, fee, clientPercent);

    await tx.payment.update({
      where: { paymentId: held.paymentId },
      data:
        ruling === 'FULL_REFUND'
          ? { status: 'refunded', settledAt: new Date() }
          : { status: 'completed', settledAt: new Date(), amount: outcome.payoutToPro, platformFee: outcome.platformFee },
    });
    return outcome;
  });
}
