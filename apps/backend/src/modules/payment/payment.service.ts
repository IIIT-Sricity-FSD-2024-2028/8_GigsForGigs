/**
 * Simulated escrow. Client pays gig amount + PLATFORM_FEE_RATE at hire time
 * (pending -> held); on release the gig amount goes to the pro and the fee
 * stays with the platform (held -> completed). No gateway is involved.
 */
import { prisma } from 'db';
import { conflict, notFound } from '../../lib/httpError.js';
import { isTaskWorkComplete } from '../../lib/taskRules.js';

export const PLATFORM_FEE_RATE = 0.1;

/** Fee in rupees, rounded to paise so it matches the DECIMAL(10,2) column. */
export function platformFeeFor(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
}

/** The client's own task plus its hired professional's payment row. */
async function requireOwnedContract(clientId: number, taskId: number) {
  const task = await prisma.task.findFirst({
    where: { taskId, clientId },
    include: { applications: { where: { status: 'accepted' }, take: 1 }, payments: true },
  });
  if (!task) throw notFound('Task not found');
  const hired = task.applications[0];
  const payment = hired ? task.payments.find((p) => p.gigProfileId === hired.gigProfileId) : undefined;
  if (!hired || !payment) throw conflict('Nobody has been hired for this task yet');
  return { task, hired, payment };
}

/** Client funds the task: pending -> held. Conditional update so a double click can't pay twice. */
export async function payForTask(clientId: number, taskId: number): Promise<void> {
  const { hired } = await requireOwnedContract(clientId, taskId);
  const moved = await prisma.payment.updateMany({
    where: { taskId, gigProfileId: hired.gigProfileId, status: 'pending' },
    data: { status: 'held' },
  });
  if (moved.count !== 1) throw conflict('This task has already been funded');
}

/** Client releases escrow to the pro: held -> completed, and the task completes with it. */
export async function releaseForTask(clientId: number, taskId: number): Promise<void> {
  const { task, hired, payment } = await requireOwnedContract(clientId, taskId);
  if (payment.status === 'pending') throw conflict('Fund the task before releasing payment');
  if (task.status !== 'in_progress' || payment.status !== 'held') {
    throw conflict('Payment for this task has already been released');
  }
  if (!(await isTaskWorkComplete(taskId))) {
    throw conflict('All required deliverables must be approved before payment can be released');
  }
  await releasePayment(taskId, hired.gigProfileId);
}

/** Release to the pro: held -> completed and the task is completed with it. */
export async function releasePayment(taskId: number, gigProfileId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const moved = await tx.payment.updateMany({
      where: { taskId, gigProfileId, status: 'held' },
      data: { status: 'completed' },
    });
    if (moved.count !== 1) throw conflict('Payment is not in escrow');
    await tx.task.update({ where: { taskId }, data: { status: 'completed' } });
  });
}

/** Admin refund: held -> refunded. The task is closed as completed; TASKS has no cancelled status. */
export async function refundPayment(taskId: number, gigProfileId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const moved = await tx.payment.updateMany({
      where: { taskId, gigProfileId, status: 'held' },
      data: { status: 'refunded' },
    });
    if (moved.count !== 1) throw conflict('Payment is not in escrow');
    await tx.task.update({ where: { taskId }, data: { status: 'completed' } });
  });
}
