/**
 * End-to-end checks of client -> manager task assignment against the real DB:
 * hire needs no manager, the client picks one only after funding, managers see
 * only tasks assigned to them, and only the client can release payment.
 * Each test creates its own rows (unique emails) and everything is deleted afterwards.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { prisma } from "db";
import { app } from "../../app.js";
import { signToken } from "../../lib/jwt.js";

let server: Server;
let baseUrl = "";
const tag = `tm${Date.now()}`;
const created = { users: [] as number[], clients: [] as number[], gigs: [] as number[] };
let seq = 0;

async function user(role: "client" | "manager" | "gig_professional", name: string) {
  const u = await prisma.user.create({ data: { name, email: `${tag}.${++seq}.${name.toLowerCase()}@example.test`, hashPassword: "x", role } });
  created.users.push(u.userId);
  return u;
}

/** A client with `managerCount` managers, one gig pro, and an open task with a pending application. */
async function fixture(managerCount: number) {
  const cu = await user("client", "Client");
  const client = await prisma.client.create({ data: { userId: cu.userId, clientName: "Test Co", numberOfManager: managerCount } });
  created.clients.push(client.clientId);
  const managers = [];
  for (let i = 0; i < managerCount; i++) {
    const m = await prisma.manager.create({ data: { userId: (await user("manager", `Mgr${i}`)).userId, clientId: client.clientId } });
    managers.push({ managerId: m.managerId, token: signToken({ role: "manager", userId: m.userId, managerId: m.managerId, clientId: client.clientId }) });
  }
  const gu = await user("gig_professional", "Gina");
  const gig = await prisma.gigProfessionalProfile.create({ data: { userId: gu.userId } });
  created.gigs.push(gig.gigProfileId);
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} task`, budget: 1000 } });
  const application = await prisma.application.create({ data: { gigProfileId: gig.gigProfileId, taskId: task.taskId } });
  return {
    taskId: task.taskId,
    applicationId: application.applicationId,
    gigProfileId: gig.gigProfileId,
    clientToken: signToken({ role: "client", userId: cu.userId, clientId: client.clientId }),
    gigToken: signToken({ role: "gig_professional", userId: gu.userId, gigProfileId: gig.gigProfileId }),
    managers,
  };
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
  await prisma.taskDeliverableDefinition.deleteMany({ where: { task } });
  await prisma.payment.deleteMany({ where: { task } });
  await prisma.gigManagerAssignment.deleteMany({ where: { task } });
  await prisma.application.deleteMany({ where: { task } });
  await prisma.review.deleteMany({ where: { task } });
  await prisma.task.deleteMany({ where: task });
  await prisma.serviceRequest.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.service.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.manager.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.client.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.gigProfessionalProfile.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.user.deleteMany({ where: { userId: { in: created.users } } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("client assigns a manager after funding; managers see only their tasks; only the client releases", async () => {
  const f = await fixture(2);
  const t = f.taskId;
  const [a, b] = f.managers as [{ managerId: number; token: string }, { managerId: number; token: string }];

  // Hire: no manager is picked automatically.
  assert.equal(await status("PATCH", `/applications/${f.applicationId}`, f.clientToken, { status: "accepted" }), 200);
  const assignment = await prisma.gigManagerAssignment.findFirstOrThrow({ where: { taskId: t } });
  assert.equal(assignment.managerId, null);

  // Unassigned task is invisible to every manager.
  assert.equal(await status("GET", `/managers/me/tasks/${t}`, a.token), 404);

  // Can't choose a manager before paying.
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: a.managerId }), 409);

  assert.equal(await status("POST", "/payments/pay", f.clientToken, { taskId: t }), 200);

  // Unknown manager / bad body rejected; managers can't assign themselves.
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: 2_000_000_000 }), 404);
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, {}), 400);
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, a.token, { managerId: a.managerId }), 403);

  // Assign A: A sees it, B doesn't.
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: a.managerId }), 200);
  assert.equal(await status("GET", `/managers/me/tasks/${t}`, a.token), 200);
  assert.equal(await status("GET", `/managers/me/tasks/${t}`, b.token), 404);
  const listA = await (await call("GET", "/managers/me/tasks", a.token)).json();
  const listB = await (await call("GET", "/managers/me/tasks", b.token)).json();
  assert.ok(listA.some((x: { taskId: number }) => x.taskId === t));
  assert.ok(!listB.some((x: { taskId: number }) => x.taskId === t));

  // Contract exposes the chosen manager.
  const contracts = await (await call("GET", "/contracts", f.clientToken)).json();
  assert.equal(contracts.find((c: { taskId: number }) => c.taskId === t).managerId, a.managerId);

  // Assigned manager has full CRUD on deliverable definitions; B has none.
  const createdDef = await call("POST", `/managers/me/tasks/${t}/deliverable-definitions`, a.token, { title: "Homepage" });
  assert.equal(createdDef.status, 201);
  const { definitionId } = await createdDef.json();
  assert.equal(await status("PATCH", `/managers/me/tasks/${t}/deliverable-definitions/${definitionId}`, a.token, { title: "Landing page" }), 200);
  assert.equal(await status("GET", `/managers/me/tasks/${t}/deliverable-definitions`, a.token), 200);
  assert.equal(await status("POST", `/managers/me/tasks/${t}/deliverable-definitions`, b.token, { title: "Nope" }), 404);
  // Client still sees the manager's definition.
  const clientDefs = await (await call("GET", `/tasks/${t}/deliverable-definitions`, f.clientToken)).json();
  assert.equal(clientDefs[0].title, "Landing page");
  assert.equal(await status("DELETE", `/managers/me/tasks/${t}/deliverable-definitions/${definitionId}`, a.token), 204);

  // Money stays client-only.
  assert.equal(await status("POST", "/payments/release", a.token, { taskId: t }), 403);
  assert.equal(await status("POST", "/payments/pay", a.token, { taskId: t }), 403);

  // Client takes the task back: A loses access.
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: null }), 200);
  assert.equal(await status("GET", `/managers/me/tasks/${t}`, a.token), 404);
});

test("another client's manager can't be assigned, and can't see the task", async () => {
  const mine = await fixture(1);
  const other = await fixture(1);
  const foreign = other.managers[0]!;
  await status("PATCH", `/applications/${mine.applicationId}`, mine.clientToken, { status: "accepted" });
  await status("POST", "/payments/pay", mine.clientToken, { taskId: mine.taskId });
  assert.equal(await status("PATCH", `/tasks/${mine.taskId}/manager`, mine.clientToken, { managerId: foreign.managerId }), 404);
  assert.equal(await status("GET", `/managers/me/tasks/${mine.taskId}`, foreign.token), 404);
  // Other client can't touch my task's manager either.
  assert.equal(await status("PATCH", `/tasks/${mine.taskId}/manager`, other.clientToken, { managerId: foreign.managerId }), 404);
});

test("client with no managers can hire, receive work, approve and release on their own", async () => {
  const f = await fixture(0);
  const t = f.taskId;
  assert.equal(await status("PATCH", `/applications/${f.applicationId}`, f.clientToken, { status: "accepted" }), 200);
  assert.equal(await status("POST", "/payments/pay", f.clientToken, { taskId: t }), 200);

  // Gig pro submits against an assignment with no manager.
  assert.equal(await status("POST", "/gig/deliverables", f.gigToken, { taskId: t, content: "Done" }), 201);
  assert.equal(await status("PATCH", `/deliverables/${t}-1`, f.clientToken, { status: "approved" }), 200);
  assert.equal(await status("POST", "/payments/release", f.clientToken, { taskId: t }), 200);
  assert.equal((await prisma.task.findUniqueOrThrow({ where: { taskId: t } })).status, "completed");

  // Completed task can't be reassigned.
  assert.equal(await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: null }), 409);
});

test("assigned manager reviews and closes work; unassigned manager can't; client releases", async () => {
  const f = await fixture(2);
  const t = f.taskId;
  const [a, b] = f.managers as [{ managerId: number; token: string }, { managerId: number; token: string }];
  await status("PATCH", `/applications/${f.applicationId}`, f.clientToken, { status: "accepted" });
  await status("POST", "/payments/pay", f.clientToken, { taskId: t });
  await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: a.managerId });

  // Manager defines the scope; the gig pro submits against it.
  const def = await (await call("POST", `/managers/me/tasks/${t}/deliverable-definitions`, a.token, { title: "Logo" })).json();
  const definitionIds = [def.definitionId];
  assert.equal(await status("POST", "/gig/deliverables", f.gigToken, { taskId: t, content: "Draft", definitionIds }), 201);
  assert.equal(await status("PATCH", `/managers/me/tasks/${t}/deliverables/1/review`, b.token, { status: "approved" }), 404);
  assert.equal(await status("PATCH", `/managers/me/tasks/${t}/deliverables/1/review`, a.token, { status: "revision_requested", feedback: "Fix header" }), 200);
  assert.equal(await status("POST", "/gig/deliverables", f.gigToken, { taskId: t, content: "Final", definitionIds }), 201);
  assert.equal(await status("PATCH", `/managers/me/tasks/${t}/deliverables/2/review`, a.token, { status: "approved" }), 200);
  assert.equal(await status("PATCH", `/managers/me/tasks/${t}/deliverables/2/close`, a.token), 200);

  assert.equal(await status("POST", "/payments/release", a.token, { taskId: t }), 403);
  assert.equal(await status("POST", "/payments/release", f.clientToken, { taskId: t }), 200);
});

test("service-hire contracts also start without a manager", async () => {
  const f = await fixture(1);
  const svc = await call("POST", "/gig/services", f.gigToken, { title: `${tag} service`, price: 500 });
  assert.equal(svc.status, 201);
  const { serviceId } = await svc.json();
  const req = await call("POST", `/services/${serviceId}/requests`, f.clientToken);
  assert.equal(req.status, 201);
  const { task, application } = await req.json();
  assert.equal(await status("POST", `/gig/requests/${application.applicationId}/respond`, f.gigToken, { action: "accepted" }), 200);
  const assignment = await prisma.gigManagerAssignment.findFirstOrThrow({ where: { taskId: task.taskId } });
  assert.equal(assignment.managerId, null);
});

test("removing a manager hands their tasks to another manager; the last one is blocked", async () => {
  const f = await fixture(2);
  const t = f.taskId;
  const [a, b] = f.managers as [{ managerId: number; token: string }, { managerId: number; token: string }];
  await status("PATCH", `/applications/${f.applicationId}`, f.clientToken, { status: "accepted" });
  await status("POST", "/payments/pay", f.clientToken, { taskId: t });
  await status("PATCH", `/tasks/${t}/manager`, f.clientToken, { managerId: a.managerId });

  assert.equal(await status("DELETE", `/managers/${a.managerId}`, f.clientToken), 204);
  assert.equal((await prisma.gigManagerAssignment.findFirstOrThrow({ where: { taskId: t } })).managerId, b.managerId);
  assert.equal(await status("DELETE", `/managers/${b.managerId}`, f.clientToken), 409);
});
