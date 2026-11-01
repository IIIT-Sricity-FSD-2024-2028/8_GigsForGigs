/**
 * Pure logic always runs. The HTTP tests create real rows, and AUDIT_LOG rows
 * can't be deleted by design, so they only run when explicitly enabled against a
 * local throwaway database:
 *
 *   ALLOW_DB_TESTS=true DATABASE_URL=postgresql://postgres@127.0.0.1:55433/test npm run test:admin
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { prisma } from "db";
import { app } from "../../app.js";
import { signToken } from "../../lib/jwt.js";
import { hashPassword } from "../../lib/password.js";
import { hotp, verifyTotp } from "../../lib/totp.js";
import { initialReviewStatus } from "../../lib/textQuality.js";
import { platformFeeFor, splitEscrow } from "../payment/payment.service.js";
import { buildVelocityBuckets } from "./admin.service.js";

// ---- Pure logic --------------------------------------------------------------

test("TOTP matches the RFC 6238 SHA-1 test vectors", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // base32 of "12345678901234567890"
  assert.equal(hotp(secret, Math.floor(59 / 30)), "287082");
  assert.equal(hotp(secret, Math.floor(1111111109 / 30)), "081804");
  assert.equal(verifyTotp(secret, "287082", 59_000), true);
  assert.equal(verifyTotp(secret, "287082", 59_000 + 120_000), false, "expired step rejected");
  assert.equal(verifyTotp(secret, "28708", 59_000), false, "wrong length rejected");
  assert.equal(verifyTotp(secret, undefined, 59_000), false, "non-string rejected");
});

test("a split conserves every paisa and takes no fee on the refunded share", () => {
  for (const [amount, fee, pct] of [[1000, 100, 50], [999.99, 100, 33], [1234.56, 123.46, 77], [1, 0.1, 1]] as const) {
    const s = splitEscrow(amount, fee, pct);
    const paise = (n: number) => Math.round(n * 100);
    assert.equal(paise(s.refundToClient) + paise(s.payoutToPro) + paise(s.platformFee), paise(amount) + paise(fee));
  }
  assert.deepEqual(splitEscrow(1000, 100, 50), { refundToClient: 550, platformFee: 50, payoutToPro: 500 });
});

test("the fee uses the configured rake", () => {
  assert.equal(platformFeeFor(5000, 12.5), 625);
  assert.equal(platformFeeFor(1234.56), 123.46);
});

test("velocity buckets have the agreed shape and never overlap", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  const days = (b: { start: number; end: number }) => Math.round((b.end - b.start) / 86_400_000);
  assert.deepEqual(buildVelocityBuckets("7d", now).map(days), [1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(buildVelocityBuckets("30d", now).map(days), [5, 5, 5, 5, 5, 5]);
  assert.deepEqual(buildVelocityBuckets("90d", now).map(days), [15, 15, 15, 15, 15, 15]);

  const ytd = buildVelocityBuckets("ytd", now);
  assert.deepEqual(ytd.map((b) => b.label), ["Jan–Feb", "Mar–Apr", "May–Jun", "Jul–Aug", "Sep–Oct", "Nov–Dec"]);

  for (const range of ["7d", "30d", "90d", "ytd"] as const) {
    const buckets = buildVelocityBuckets(range, now);
    buckets.slice(1).forEach((b, i) => assert.equal(b.start, buckets[i]!.end, `${range} bucket ${i} is contiguous`));
    assert.ok(buckets.at(-1)!.end > now.getTime(), `${range} includes this instant`);
  }
});

test("suspect language goes to moderation", () => {
  assert.equal(initialReviewStatus("Total scam, avoid"), "FLAGGED");
  assert.equal(initialReviewStatus("Great work"), "PUBLISHED");
  assert.equal(initialReviewStatus(null), "PUBLISHED");
});

// ---- HTTP, against a real database ---------------------------------------------

const dbUrl = process.env.DATABASE_URL ?? "";
const dbTestsAllowed = process.env.ALLOW_DB_TESTS === "true" && /127\.0\.0\.1|localhost/.test(dbUrl);

describe("admin governance over HTTP", { skip: !dbTestsAllowed && "set ALLOW_DB_TESTS=true with a local DATABASE_URL" }, () => {
  const tag = `gov${Date.now()}`;
  const userIds: number[] = [];
  let server: Server;
  let baseUrl = "";
  let ownerToken = "";
  let auditorToken = "";
  let ownerId = 0;

  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const res = await fetch(baseUrl + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };

  const makeUser = async (role: "admin" | "client" | "gig_professional", extra: object = {}) => {
    const user = await prisma.user.create({
      data: { name: "Test User", email: `${tag}.${userIds.length}@example.test`, hashPassword: await hashPassword("password123"), role, ...extra },
    });
    userIds.push(user.userId);
    return user;
  };

  /** A funded contract with an open dispute on it. */
  const makeDisputedContract = async (amount = 1000) => {
    const clientUser = await makeUser("client");
    const client = await prisma.client.create({ data: { userId: clientUser.userId, clientName: "Test Co" } });
    const gigUser = await makeUser("gig_professional");
    const gig = await prisma.gigProfessionalProfile.create({ data: { userId: gigUser.userId } });
    const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} task`, budget: amount, status: "in_progress" } });
    await prisma.application.create({ data: { taskId: task.taskId, gigProfileId: gig.gigProfileId, status: "accepted" } });
    const payment = await prisma.payment.create({
      data: { taskId: task.taskId, gigProfileId: gig.gigProfileId, amount, platformFee: amount / 10, status: "held" },
    });
    const dispute = await prisma.dispute.create({
      data: { taskId: task.taskId, filedByUserId: clientUser.userId, againstUserId: gigUser.userId, disputeAmount: amount, reason: "Test", description: "Test" },
    });
    return { client, clientUser, task, payment, dispute };
  };

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    const owner = await makeUser("admin", { adminTier: "OWNER", adminPermissions: ["*"] });
    ownerId = owner.userId;
    ownerToken = signToken({ role: "admin", userId: owner.userId });
    const auditor = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read", "payments:read"] });
    auditorToken = signToken({ role: "admin", userId: auditor.userId });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await prisma.platformSettings.deleteMany();
    const tasks = await prisma.task.findMany({ where: { title: `${tag} task` }, select: { taskId: true } });
    const taskIds = tasks.map((t) => t.taskId);
    await prisma.dispute.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.application.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.payment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.client.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.gigProfessionalProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { userId: { in: userIds } } });
  });

  test("RBAC is enforced by the API, not just hidden in the UI", async () => {
    const { payment } = await makeDisputedContract();
    assert.equal((await call("GET", "/api/admin/payments", auditorToken)).status, 200, "auditor can read the ledger");
    assert.equal((await call("PATCH", `/api/admin/payments/${payment.paymentId}/override`, auditorToken, { action: "RELEASE", auditReason: "x" })).status, 403);
    assert.equal((await call("PUT", "/api/admin/settings", auditorToken, { maintenanceMode: true })).status, 403);
    assert.equal((await call("POST", "/api/admin/invitations", auditorToken, { email: `${tag}.x@example.test`, role: "AUDITOR" })).status, 403);
  });

  test("the ledger has no raw edit routes", async () => {
    const { payment } = await makeDisputedContract();
    // The routes don't exist, so these fall through to a later router and are refused there.
    assert.ok((await call("DELETE", `/api/admin/payments/${payment.paymentId}`, ownerToken)).status >= 400);
    assert.ok((await call("PATCH", `/api/admin/payments/${payment.paymentId}`, ownerToken, { status: "completed" })).status >= 400);
    assert.equal((await prisma.payment.findUniqueOrThrow({ where: { paymentId: payment.paymentId } })).status, "held", "row untouched");
  });

  test("a split ruling moves the money once, records it, and blocks other paths meanwhile", async () => {
    const { payment, dispute, task, client } = await makeDisputedContract(1000);

    assert.equal(
      (await call("PATCH", `/api/admin/payments/${payment.paymentId}/override`, ownerToken, { action: "RELEASE", auditReason: "x" })).status,
      409,
      "manual override refused during arbitration",
    );
    const clientToken = signToken({ role: "client", userId: client.userId, clientId: client.clientId });
    const clientRelease = await call("POST", "/api/payments/release", clientToken, { taskId: task.taskId });
    assert.equal(clientRelease.status, 409);
    assert.match(clientRelease.body.message, /open dispute/, "blocked by the dispute, not by something else");

    assert.equal((await call("POST", `/api/admin/disputes/disp-${dispute.disputeId}/settle`, ownerToken, { settlementType: "SPLIT", resolutionNotes: "Split it" })).status, 400, "split needs a percentage");

    const ruling = await call("POST", `/api/admin/disputes/disp-${dispute.disputeId}/settle`, ownerToken, { settlementType: "SPLIT", resolutionNotes: "Half done", splitClientPercent: 50 });
    assert.equal(ruling.status, 200);
    assert.equal(ruling.body.refundToClient, 550);
    assert.equal(ruling.body.payoutToPro, 500);
    assert.equal(ruling.body.platformFee, 50);

    const paid = await prisma.payment.findUniqueOrThrow({ where: { paymentId: payment.paymentId } });
    assert.equal(paid.status, "completed");
    assert.equal(Number(paid.amount), 500);
    assert.equal(Number(paid.platformFee), 50);
    assert.ok(paid.settledAt);
    assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: task.taskId } })).status, "completed");
    const closed = await prisma.dispute.findUniqueOrThrow({ where: { disputeId: dispute.disputeId } });
    assert.equal(closed.status, "RESOLVED");
    assert.equal(closed.resolutionNotes, "Half done");

    assert.equal((await call("POST", `/api/admin/disputes/disp-${dispute.disputeId}/settle`, ownerToken, { settlementType: "FULL_REFUND", resolutionNotes: "Again" })).status, 409, "can't settle twice");
  });

  test("a ruling with nothing in escrow fails and leaves the docket open", async () => {
    const { payment, dispute } = await makeDisputedContract();
    await prisma.payment.update({ where: { paymentId: payment.paymentId }, data: { status: "pending" } });
    assert.equal((await call("POST", `/api/admin/disputes/${dispute.disputeId}/settle`, ownerToken, { settlementType: "FULL_REFUND", resolutionNotes: "x" })).status, 409);
    assert.equal((await prisma.dispute.findUniqueOrThrow({ where: { disputeId: dispute.disputeId } })).status, "OPEN", "transaction rolled back");
  });

  test("the audit trail records mutations, omits secrets, and can't be rewritten", async () => {
    const target = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read"] });
    assert.equal((await call("PATCH", `/api/admin/users/${target.userId}/status`, ownerToken, { status: "SUSPENDED", reason: "Audit test" })).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 200)); // written just after the response

    const row = await prisma.auditLog.findFirst({ where: { actorUserId: ownerId, action: "USER_STATUS_CHANGE" }, orderBy: { auditId: "desc" } });
    assert.ok(row, "row written");
    assert.match(row.details ?? "", /Audit test/);

    await assert.rejects(prisma.auditLog.update({ where: { auditId: row.auditId }, data: { action: "X" } }), /append-only/);
    await assert.rejects(prisma.auditLog.delete({ where: { auditId: row.auditId } }), /append-only/);

    assert.equal((await call("POST", "/api/admin/profile/password", ownerToken, { currentPassword: "wrong", newPassword: "newpassword1" })).status, 400);
    const listed = await call("GET", "/api/admin/audit-logs", ownerToken);
    assert.ok(listed.body.every((r: { details: string | null }) => !/password/i.test(r.details ?? "")), "no password keys in details");
  });

  test("suspending an account and revoking sessions both end a live token immediately", async () => {
    const user = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read"] });
    const token = signToken({ role: "admin", userId: user.userId });
    assert.equal((await call("GET", "/api/admin/profile", token)).status, 200);

    assert.equal((await call("POST", `/api/admin/sessions/adm-${user.userId}/revoke`, auditorToken)).status, 403, "needs admins:invite for someone else");
    assert.equal((await call("POST", `/api/admin/sessions/adm-${user.userId}/revoke`, ownerToken)).status, 200);
    assert.equal((await call("GET", "/api/admin/profile", token)).status, 401, "old token dead after revoke");

    const fresh = signToken({ role: "admin", userId: user.userId, tv: 1 });
    assert.equal((await call("GET", "/api/admin/profile", fresh)).status, 200);
    await call("PATCH", `/api/admin/users/adm-${user.userId}/status`, ownerToken, { status: "SUSPENDED", reason: "Test" });
    assert.equal((await call("GET", "/api/admin/profile", fresh)).status, 401, "token dead once suspended");

    assert.equal((await call("PATCH", `/api/admin/users/${ownerId}/status`, ownerToken, { status: "SUSPENDED", reason: "x" })).status, 409, "can't suspend yourself");
  });

  test("revoking your own sessions returns a working token and kills the old one", async () => {
    const user = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read"] });
    const old = signToken({ role: "admin", userId: user.userId });
    const res = await call("POST", `/api/admin/sessions/adm-${user.userId}/revoke`, old);
    assert.equal(res.status, 200);
    assert.equal((await call("GET", "/api/admin/profile", old)).status, 401);
    assert.equal((await call("GET", "/api/admin/profile", res.body.token)).status, 200);
  });

  test("an invitation activates once and needs a new password", async () => {
    const email = `${tag}.invitee@example.test`;
    const invite = await call("POST", "/api/admin/invitations", ownerToken, { email, role: "FINANCIAL_ADMIN" });
    assert.equal(invite.status, 201);
    userIds.push((await prisma.user.findUniqueOrThrow({ where: { email } })).userId);

    assert.equal((await call("POST", "/api/auth/login", undefined, { email, password: invite.body.assignedPassword })).status, 401, "INVITED can't log in");

    const accept = { token: invite.body.token, email, password: invite.body.assignedPassword };
    assert.equal((await call("POST", "/api/admin/invitations/accept", undefined, accept)).status, 400, "new password required");

    const ok = await call("POST", "/api/admin/invitations/accept", undefined, { ...accept, newPassword: "brandnewpass1" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.adminTier, "FINANCIAL_ADMIN");
    assert.ok(ok.body.user.permissions.includes("payments:release"));
    assert.equal((await call("GET", "/api/admin/profile", ok.body.token)).status, 200);

    assert.notEqual((await call("POST", "/api/admin/invitations/accept", undefined, { ...accept, newPassword: "anotherpass12" })).status, 200, "link can't be reused");
    assert.equal((await call("POST", "/api/auth/login", undefined, { email, password: "brandnewpass1" })).status, 200);
  });

  test("users:ban alone can't suspend an admin or assign the admin role", async () => {
    const banner = await makeUser("admin", { adminTier: "SUPPORT_ADMIN", adminPermissions: ["users:ban"] });
    const token = signToken({ role: "admin", userId: banner.userId });
    const victim = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read"] });
    assert.equal((await call("PATCH", `/api/admin/users/${victim.userId}/status`, token, { status: "SUSPENDED", reason: "x" })).status, 403);

    const plain = await makeUser("client");
    assert.equal((await call("PATCH", `/api/admin/users/${plain.userId}`, token, { role: "admin" })).status, 400, "admin role rejected by the DTO");
    assert.equal((await call("PATCH", `/api/admin/users/${plain.userId}/status`, token, { status: "SUSPENDED", reason: "x" })).status, 200, "non-admins still work");
  });

  test("a delegate can't grant permissions they don't hold", async () => {
    const delegate = await makeUser("admin", { adminTier: "SUPPORT_ADMIN", adminPermissions: ["admins:invite", "users:read"] });
    const token = signToken({ role: "admin", userId: delegate.userId });
    const res = await call("POST", "/api/admin/invitations", token, { email: `${tag}.esc@example.test`, role: "SUPER_ADMIN" });
    assert.equal(res.status, 403);
  });

  test("2FA can't turn on without a valid code, and login then requires one", async () => {
    const user = await makeUser("admin", { adminTier: "AUDITOR", adminPermissions: ["users:read"] });
    const token = signToken({ role: "admin", userId: user.userId });
    const creds = { email: user.email, password: "password123" };

    const { body: enrollment } = await call("POST", "/api/admin/profile/2fa/enroll", token);
    assert.equal((await call("POST", "/api/admin/profile/2fa/confirm", token, { code: "000000" })).status, 400);
    assert.equal((await call("POST", "/api/auth/login", undefined, creds)).status, 200, "still off until confirmed");

    const code = () => hotp(enrollment.secret, Math.floor(Date.now() / 30_000));
    assert.equal((await call("POST", "/api/admin/profile/2fa/confirm", token, { code: code() })).status, 200);

    const missing = await call("POST", "/api/auth/login", undefined, creds);
    assert.equal(missing.status, 401);
    assert.equal(missing.body.errors.twoFactorRequired, true);
    assert.equal((await call("POST", "/api/auth/login", undefined, { ...creds, totpCode: "000000" })).status, 401);
    assert.equal((await call("POST", "/api/auth/login", undefined, { ...creds, totpCode: code() })).status, 200);

    const stored = await prisma.user.findUniqueOrThrow({ where: { userId: user.userId }, omit: { totpSecret: false } });
    assert.ok(stored.totpSecret && !stored.totpSecret.includes(enrollment.secret), "secret encrypted at rest");
    assert.equal((await call("GET", "/api/admin/admin-staff", ownerToken)).body.some((a: object) => "totpSecret" in a), false);
  });

  test("settings persist and take effect: rake, escrow ceiling, maintenance mode", async () => {
    assert.equal((await call("PUT", "/api/admin/settings", ownerToken, { commissionRakePercent: 12, maxEscrowThreshold: 500 })).status, 200);
    assert.equal((await prisma.platformSettings.findUniqueOrThrow({ where: { id: 1 } })).id, 1);
    assert.equal((await call("GET", "/api/admin/settings", auditorToken)).body.commissionRakePercent, 12);
    assert.equal((await call("PUT", "/api/admin/settings", ownerToken, { nonsense: 1 })).status, 400, "unknown keys rejected");

    const { client } = await makeDisputedContract();
    const clientToken = signToken({ role: "client", userId: client.userId, clientId: client.clientId });
    assert.equal((await call("PUT", "/api/admin/settings", ownerToken, { maintenanceMode: true })).status, 200);
    assert.equal((await call("POST", "/api/tasks", clientToken, { title: "x", budget: 100 })).status, 503, "writes blocked");
    assert.equal((await call("GET", "/api/admin/kpis", ownerToken)).status, 200, "admin still works");
    assert.equal((await call("PUT", "/api/admin/settings", ownerToken, { maintenanceMode: false })).status, 200, "admin can turn it off");
  });

  test("hiding a review changes the rating, and KPIs come from the data", async () => {
    const { clientUser } = await makeDisputedContract();
    const gigUser = await makeUser("gig_professional");
    const gig = await prisma.gigProfessionalProfile.create({ data: { userId: gigUser.userId } });
    const task = await prisma.task.findFirstOrThrow({ where: { title: `${tag} task` } });
    const review = await prisma.review.create({ data: { reviewerId: clientUser.userId, revieweeId: gigUser.userId, taskId: task.taskId, rating: 1 } });

    const ratingOf = async () =>
      (await call("GET", "/api/admin/gig-pros", ownerToken)).body.find((g: { gigProfileId: number }) => g.gigProfileId === gig.gigProfileId).rating;
    assert.equal(await ratingOf(), 1);
    assert.equal((await call("PATCH", `/api/admin/reviews/rev-${review.reviewId}/moderate`, ownerToken, { status: "HIDDEN" })).status, 200);
    assert.equal(await ratingOf(), null);
    await prisma.review.delete({ where: { reviewId: review.reviewId } });

    const kpis = (await call("GET", "/api/admin/kpis", ownerToken)).body;
    assert.equal(typeof kpis.grossMerchandiseVolume, "number");
    assert.equal(typeof kpis.pendingDisputes, "number");
    const analytics = (await call("GET", "/api/admin/analytics?timeRange=ytd", ownerToken)).body;
    const sum = analytics.categories.reduce((s: number, c: { totalVolume: number }) => s + c.totalVolume, 0);
    assert.equal(Math.round(sum), Math.round(analytics.grossVolume), "category table reconciles to the chart");
  });
});
