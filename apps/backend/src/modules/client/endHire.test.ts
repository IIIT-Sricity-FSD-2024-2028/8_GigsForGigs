/**
 * Ending a hire before any work was submitted (client removes / professional
 * withdraws) and the applicant review rating on the client's applications list.
 * Runs against the real DB; every row it creates is deleted afterwards.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { prisma } from "db";
import { app } from "../../app.js";
import { signToken } from "../../lib/jwt.js";

let server: Server;
let baseUrl = "";
const tag = `eh${Date.now()}`;
const created = { users: [] as number[], clients: [] as number[], gigs: [] as number[] };
let seq = 0;

async function user(role: "client" | "gig_professional", name: string) {
  const u = await prisma.user.create({ data: { name, email: `${tag}.${++seq}.${name.toLowerCase()}@example.test`, hashPassword: "x", role } });
  created.users.push(u.userId);
  return u;
}

async function gigPro(name: string) {
  const u = await user("gig_professional", name);
  const g = await prisma.gigProfessionalProfile.create({ data: { userId: u.userId } });
  created.gigs.push(g.gigProfileId);
  return { userId: u.userId, gigProfileId: g.gigProfileId, token: signToken({ role: "gig_professional", userId: u.userId, gigProfileId: g.gigProfileId }) };
}

async function clientWithTask() {
  const cu = await user("client", "Client");
  const client = await prisma.client.create({ data: { userId: cu.userId, clientName: "Test Co" } });
  created.clients.push(client.clientId);
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} task`, budget: 1000 } });
  return { userId: cu.userId, taskId: task.taskId, token: signToken({ role: "client", userId: cu.userId, clientId: client.clientId }) };
}

async function apply(gigProfileId: number, taskId: number) {
  return (await prisma.application.create({ data: { gigProfileId, taskId } })).applicationId;
}

function call(method: string, path: string, token: string, body?: unknown) {
  return fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function status(method: string, path: string, token: string, body?: unknown) {
  const res = await call(method, path, token, body);
  await res.text();
  return res.status;
}

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  const task = { clientId: { in: created.clients } };
  await prisma.deliverable.deleteMany({ where: { task } });
  await prisma.payment.deleteMany({ where: { task } });
  await prisma.gigManagerAssignment.deleteMany({ where: { task } });
  await prisma.application.deleteMany({ where: { task } });
  await prisma.review.deleteMany({ where: { task } });
  await prisma.dispute.deleteMany({ where: { task } });
  await prisma.task.deleteMany({ where: task });
  await prisma.serviceRequest.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.service.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.client.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.gigProfessionalProfile.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.user.deleteMany({ where: { userId: { in: created.users } } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("professional withdraws before funding: hire ends, history kept, task stays open for others, no duplicate or re-apply", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Ann");
  const b = await gigPro("Ben");
  const appA = await apply(a.gigProfileId, c.taskId);
  const appB = await apply(b.gigProfileId, c.taskId);
  assert.equal(await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" }), 200);

  // Someone who isn't hired can't withdraw (Ben only applied); a client token has no route at all.
  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, b.token), 409);
  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, c.token), 403);

  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, a.token), 204);
  // Duplicate request.
  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, a.token), 409);

  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "withdrawn");
  assert.equal(await prisma.gigManagerAssignment.count({ where: { taskId: c.taskId } }), 0);
  assert.equal(await prisma.payment.count({ where: { taskId: c.taskId } }), 0);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: c.taskId } })).status, "open");
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appB } })).status, "pending");

  const active = await (await call("GET", "/gig/tasks/active", a.token)).json();
  assert.equal(active.length, 0);
  const contracts = await (await call("GET", "/contracts", c.token)).json();
  assert.equal(contracts.length, 0);
  // A withdrawn hire may apply again (see the re-hire test); a rejection may not.

  // The client can still hire the other applicant.
  assert.equal(await status("PATCH", `/applications/${appB}`, c.token, { status: "accepted" }), 200);
});

test("client removes a funded professional: escrow is returned, only the owner may, unrelated or settled hires are refused", async () => {
  const c = await clientWithTask();
  const other = await clientWithTask();
  const a = await gigPro("Cy");
  const appA = await apply(a.gigProfileId, c.taskId);
  assert.equal(await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" }), 200);
  assert.equal(await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId }), 200);

  // Another client can't touch this task; the owner can't remove someone who isn't hired on it.
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, other.token), 404);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/999999999`, c.token), 409);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/abc`, c.token), 400);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, a.token), 403);

  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token), 204);
  const payment = await prisma.payment.findFirstOrThrow({ where: { taskId: c.taskId } });
  assert.equal(payment.status, "failed");
  assert.ok(payment.settledAt);
  assert.equal(await prisma.gigManagerAssignment.count({ where: { taskId: c.taskId } }), 0);
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "removed");
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token), 409);

  // A hire that was already paid out is settled and can't be ended.
  const d = await gigPro("Di");
  const appD = await apply(d.gigProfileId, c.taskId);
  await status("PATCH", `/applications/${appD}`, c.token, { status: "accepted" });
  await prisma.payment.update({ where: { taskId_gigProfileId: { taskId: c.taskId, gigProfileId: d.gigProfileId } }, data: { status: "completed" } });
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${d.gigProfileId}`, c.token), 409);
  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, d.token), 409);
});

test("neither side can end a hire once a deliverable was submitted", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Eve");
  const appA = await apply(a.gigProfileId, c.taskId);
  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });
  await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId });
  assert.equal(await status("POST", "/gig/deliverables", a.token, { taskId: c.taskId, content: "first draft" }), 201);

  const contract = (await (await call("GET", "/contracts", c.token)).json())[0];
  assert.equal(contract.submissionCount, 1);

  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, a.token), 409);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token), 409);
  assert.equal((await prisma.payment.findFirstOrThrow({ where: { taskId: c.taskId } })).status, "held");
  assert.equal(await prisma.gigManagerAssignment.count({ where: { taskId: c.taskId } }), 1);
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "accepted");
});

test("applications list carries each applicant's received-review average and count (published only, never reviews they wrote)", async () => {
  const c = await clientWithTask();
  const many = await gigPro("Many");
  const one = await gigPro("One");
  const none = await gigPro("None");
  const ids = new Map<string, number>();
  for (const p of [many, one, none]) ids.set(String(p.gigProfileId), await apply(p.gigProfileId, c.taskId));

  const review = async (revieweeId: number, rating: number, status = "PUBLISHED") => {
    const reviewer = await user("client", "Rev");
    await prisma.review.create({ data: { reviewerId: reviewer.userId, revieweeId, taskId: c.taskId, rating, status } });
  };
  await review(many.userId, 5);
  await review(many.userId, 4);
  await review(many.userId, 1, "HIDDEN"); // moderated: ignored
  await review(one.userId, 3);
  // A review the professional WROTE about the client must not count towards their own rating.
  await prisma.review.create({ data: { reviewerId: none.userId, revieweeId: c.userId, taskId: c.taskId, rating: 5 } });

  const list = await (await call("GET", "/applications", c.token)).json() as Array<{ gigProfileId: number; reviewRating: { average: number | null; count: number } }>;
  const by = (p: { gigProfileId: number }) => list.find((a) => a.gigProfileId === p.gigProfileId)!.reviewRating;
  assert.deepEqual(by(many), { average: 4.5, count: 2 });
  assert.deepEqual(by(one), { average: 3, count: 1 });
  assert.deepEqual(by(none), { average: null, count: 0 });
});

// ---- Re-hiring, scope lock, cancellation, disputes, funding visibility ------------------

const gigTasks = async (token: string) => (await (await call("GET", "/gig/tasks/active", token)).json()) as Array<Record<string, unknown>>;
const contractFor = async (token: string, taskId: number) => (await (await call("GET", "/contracts", token)).json() as Array<Record<string, unknown>>).find((x) => x.taskId === taskId)!;
const inMarketplace = async (token: string, taskId: number) => (await (await call("GET", "/gig/tasks/marketplace", token)).json() as Array<{ taskId: number }>).some((t) => t.taskId === taskId);

test("a withdrawn or removed professional can apply again and be re-hired; a rejection stays final; no duplicate hire", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Fay");
  const g = await gigPro("Gus");
  const appA = await apply(a.gigProfileId, c.taskId);
  const appG = await apply(g.gigProfileId, c.taskId);
  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });
  assert.equal(await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" }), 409);
  await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId });

  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, a.token), 204);
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "withdrawn");
  assert.equal(await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" }), 409);
  assert.equal(await inMarketplace(a.token, c.taskId), true);
  assert.equal(await status("POST", "/gig/applications", a.token, { taskId: c.taskId }), 201);
  assert.equal(await status("POST", "/gig/applications", a.token, { taskId: c.taskId }), 409);
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "pending");

  assert.equal(await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" }), 200);
  const payment = await prisma.payment.findUniqueOrThrow({ where: { taskId_gigProfileId: { taskId: c.taskId, gigProfileId: a.gigProfileId } } });
  assert.equal(payment.status, "pending");
  assert.equal(await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId }), 200);

  assert.equal(await status("PATCH", `/applications/${appG}`, c.token, { status: "declined" }), 200);
  assert.equal(await status("POST", "/gig/applications", g.token, { taskId: c.taskId }), 409);
  assert.equal(await inMarketplace(g.token, c.taskId), false);
});

test("scope fields are locked while someone is hired; unchanged values and harmless fields still save", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Hal");
  const appA = await apply(a.gigProfileId, c.taskId);
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { title: `${tag} renamed`, budget: 1200 }), 200);

  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { title: "Something else" }), 409);
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { budget: 5000 }), 409);
  const res = await call("PATCH", `/tasks/${c.taskId}`, c.token, { description: "new scope" });
  assert.equal(res.status, 409);
  assert.match(JSON.stringify(await res.json()), /scope/i);
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { title: `${tag} renamed`, budget: 1200, category: "design" }), 200);

  await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token);
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { title: `${tag} again` }), 200);
});

test("deleting a posting with applicants cancels it: history kept, closed to everyone", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Ivy");
  const b = await gigPro("Jon");
  const appA = await apply(a.gigProfileId, c.taskId);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}`, c.token), 204);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: c.taskId } })).status, "cancelled");
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: appA } })).status, "declined");
  assert.equal(await status("POST", "/gig/applications", b.token, { taskId: c.taskId }), 409);
  assert.equal(await status("PATCH", `/tasks/${c.taskId}`, c.token, { category: "dev" }), 409);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}`, c.token), 409);
  assert.equal(await inMarketplace(b.token, c.taskId), false);
  const mine = await (await call("GET", "/gig/applications/mine", a.token)).json() as Array<{ task: { status: string } }>;
  assert.equal(mine[0]!.task.status, "cancelled");
});

test("closed posting: ending one of two hires keeps it running; ending the last cancels it, never reopens", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Kim");
  const b = await gigPro("Lee");
  const appA = await apply(a.gigProfileId, c.taskId);
  const appB = await apply(b.gigProfileId, c.taskId);
  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });
  await status("PATCH", `/applications/${appB}`, c.token, { status: "accepted" });
  assert.equal(await status("DELETE", `/tasks/${c.taskId}`, c.token), 204);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: c.taskId } })).status, "in_progress");

  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token), 204);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: c.taskId } })).status, "in_progress");
  assert.equal(await status("DELETE", `/gig/tasks/${c.taskId}/assignment`, b.token), 204);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: c.taskId } })).status, "cancelled");
  assert.equal(await status("POST", "/gig/applications", a.token, { taskId: c.taskId }), 409);

  const o = await clientWithTask();
  const appO = await apply(a.gigProfileId, o.taskId);
  await status("PATCH", `/applications/${appO}`, o.token, { status: "accepted" });
  await status("DELETE", `/tasks/${o.taskId}/hires/${a.gigProfileId}`, o.token);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: o.taskId } })).status, "open");
});

test("service hire: when the professional withdraws, the task is archived and the client can request again", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Mia");
  const service = await prisma.service.create({ data: { gigProfileId: a.gigProfileId, title: `${tag} service`, price: 700 } });
  const first = await call("POST", `/services/${service.serviceId}/requests`, c.token);
  assert.equal(first.status, 201);
  const { task, application } = await first.json() as { task: { taskId: number }; application: { applicationId: number } };
  assert.equal(await status("POST", `/gig/requests/${application.applicationId}/respond`, a.token, { action: "accepted" }), 200);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: task.taskId } })).status, "in_progress");

  assert.equal(await status("DELETE", `/gig/tasks/${task.taskId}/assignment`, a.token), 204);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: task.taskId } })).status, "cancelled");
  assert.equal((await gigTasks(a.token)).length, 0);
  assert.equal((await prisma.application.findUniqueOrThrow({ where: { applicationId: application.applicationId } })).status, "withdrawn");
  assert.equal(await status("POST", `/services/${service.serviceId}/requests`, c.token), 201);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: task.taskId } })).status, "cancelled");
});

test("funding and work status are visible to both portals and follow the real state", async () => {
  const c = await clientWithTask();
  const a = await gigPro("Ned");
  const appA = await apply(a.gigProfileId, c.taskId);
  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });

  let mine = (await gigTasks(a.token))[0]!;
  assert.equal(mine.paymentStatus, "pending");
  assert.equal(mine.workStatus, "awaiting_funding");
  assert.equal((await contractFor(c.token, c.taskId)).workStatus, "awaiting_funding");
  assert.equal(await status("POST", "/gig/deliverables", a.token, { taskId: c.taskId, content: "too early" }), 403);

  await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId });
  mine = (await gigTasks(a.token))[0]!;
  assert.equal(mine.workStatus, "in_progress");
  assert.equal((await contractFor(c.token, c.taskId)).workStatus, "in_progress");

  assert.equal(await status("POST", "/gig/deliverables", a.token, { taskId: c.taskId, content: "draft one" }), 201);
  assert.equal((await gigTasks(a.token))[0]!.workStatus, "submitted");
  assert.equal((await contractFor(c.token, c.taskId)).workStatus, "submitted");

  assert.equal(await status("PATCH", `/deliverables/${c.taskId}-1`, c.token, { status: "revision_requested", feedback: "please fix the header" }), 200);
  assert.equal((await gigTasks(a.token))[0]!.workStatus, "revision_requested");
  assert.equal((await contractFor(c.token, c.taskId)).workStatus, "revision_requested");

  assert.equal(await status("POST", "/gig/deliverables", a.token, { taskId: c.taskId, content: "draft two" }), 201);
  assert.equal((await gigTasks(a.token))[0]!.workStatus, "submitted");
});

test("client dispute: only for held escrow with submitted work, owner only, once; it freezes release and moves no money", async () => {
  const c = await clientWithTask();
  const other = await clientWithTask();
  const a = await gigPro("Oli");
  const appA = await apply(a.gigProfileId, c.taskId);
  const body = { gigProfileId: a.gigProfileId, reason: "Work is incomplete", description: "The agreed milestones are missing." };
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, body), 409);

  await status("PATCH", `/applications/${appA}`, c.token, { status: "accepted" });
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, body), 409);
  await status("POST", "/payments/pay", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId });
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, body), 409);

  await status("POST", "/gig/deliverables", a.token, { taskId: c.taskId, content: "my work" });
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, { ...body, description: "short" }), 400);
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, other.token, body), 404);
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, a.token, body), 403);

  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, body), 201);
  assert.equal(await status("POST", `/tasks/${c.taskId}/disputes`, c.token, body), 409);

  const dispute = await prisma.dispute.findFirstOrThrow({ where: { taskId: c.taskId } });
  assert.equal(dispute.status, "OPEN");
  assert.equal(Number(dispute.disputeAmount), 1000);
  assert.equal((await prisma.payment.findFirstOrThrow({ where: { taskId: c.taskId } })).status, "held");
  assert.equal(await status("POST", "/payments/release", c.token, { taskId: c.taskId, gigProfileId: a.gigProfileId }), 409);
  assert.equal(await status("DELETE", `/tasks/${c.taskId}/hires/${a.gigProfileId}`, c.token), 409);
  assert.equal((await contractFor(c.token, c.taskId)).hasOpenDispute, true);
});
