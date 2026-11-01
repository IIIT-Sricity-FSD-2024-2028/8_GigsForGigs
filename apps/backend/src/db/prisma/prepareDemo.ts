/**
 * Puts a database into a state where every admin workflow can be demonstrated,
 * without wiping anything. Fresh data tends to have no money in escrow and no
 * open disputes, and the product has no end-user screen for filing a dispute, so
 * those screens would otherwise have nothing to act on.
 *
 * It moves up to 3 unfunded contracts into escrow, opens disputes on 2 of them
 * (one with evidence, one without), sets 1 client's KYC to PENDING and flags 1
 * review. It stops if an open dispute already exists, so it is safe to re-run.
 *
 * This writes example records. Run it only on a database you intend to demo from:
 *   ALLOW_DEMO_PREP=true npm run demo:prep
 */
import { prisma } from "../index.js";

if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_PREP !== "true") {
  console.error("Refusing to run: this adds demo records. Re-run with ALLOW_DEMO_PREP=true on a non-production database.");
  process.exit(1);
}

const openDisputes = await prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } });
if (openDisputes > 0) {
  console.log(`Nothing to do: ${openDisputes} open dispute(s) already exist.`);
  await prisma.$disconnect();
  process.exit(0);
}

const pending = await prisma.payment.findMany({
  where: { status: "pending" },
  take: 3,
  include: { task: { include: { client: true } }, gigProfile: true },
});

const dockets = [
  {
    reason: "Deliverables do not match the agreed scope",
    description: "Client reports the submitted build is missing the agreed milestones and has asked for the escrow back. The professional disputes this.",
    evidenceUrls: ["https://example.com/evidence/scope-document.pdf", "https://example.com/evidence/chat-export.pdf"],
    slaHoursLeft: 48,
  },
  {
    reason: "Client unresponsive after final submission",
    description: "Professional submitted final work and reports no response from the client. No supporting evidence was attached.",
    evidenceUrls: [],
    slaHoursLeft: 12,
  },
];

for (const [i, payment] of pending.entries()) {
  await prisma.payment.update({ where: { paymentId: payment.paymentId }, data: { status: "held" } });
  await prisma.task.update({ where: { taskId: payment.taskId }, data: { status: "in_progress" } });
  const docket = dockets[i];
  if (docket) {
    await prisma.dispute.create({
      data: {
        ...docket,
        taskId: payment.taskId,
        filedByUserId: payment.task.client.userId,
        againstUserId: payment.gigProfile.userId,
        disputeAmount: payment.amount,
      },
    });
  }
}

const client = await prisma.client.findFirst({ where: { kycStatus: "VERIFIED" }, orderBy: { clientId: "desc" } });
if (client) await prisma.client.update({ where: { clientId: client.clientId }, data: { kycStatus: "PENDING" } });

const review = await prisma.review.findFirst({ where: { status: "PUBLISHED" }, orderBy: { reviewId: "desc" } });
if (review) await prisma.review.update({ where: { reviewId: review.reviewId }, data: { status: "FLAGGED" } });

console.log(`Ready: ${pending.length} contract(s) in escrow, ${Math.min(pending.length, dockets.length)} open dispute(s), 1 pending KYC, 1 flagged review.`);
await prisma.$disconnect();
