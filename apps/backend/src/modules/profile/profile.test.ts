/**
 * End-to-end checks of the counterparty profile endpoints against the real DB:
 *  - GET /api/applications/:applicationId/profile (client views an applicant)
 *  - GET /api/gig/tasks/:taskId/client-profile   (gig pro views the task's client)
 * Covers correct mapping with several applicants on one task, authorization
 * (other clients, non-applicants, wrong roles, no token), sensitive-field
 * filtering, incomplete profiles, and contact details appearing only after hire.
 * Each run creates its own rows (unique emails) and deletes them afterwards.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { prisma } from "db";
import { app } from "../../app.js";
import { signToken } from "../../lib/jwt.js";

let server: Server;
let baseUrl = "";
const tag = `pf${Date.now()}`;
const created = { users: [] as number[], clients: [] as number[], gigs: [] as number[] };
let seq = 0;

/** Field names that must never appear anywhere in a profile response. */
const FORBIDDEN_KEYS = ["hashPassword", "totpSecret", "tokenVersion", "adminTier", "adminPermissions", "twoFactorEnabled", "kycStatus"];

async function user(role: "client" | "gig_professional", name: string) {
  const u = await prisma.user.create({
    data: { name, email: `${tag}.${++seq}.${name.toLowerCase().replace(/\s+/g, "")}@example.test`, hashPassword: "secret-hash", role },
  });
  created.users.push(u.userId);
  return u;
}

async function makeClient(name: string, data: { domain?: string; kycStatus?: string } = {}) {
  const u = await user("client", name);
  const client = await prisma.client.create({ data: { userId: u.userId, clientName: `${name} Co`, ...data } });
  created.clients.push(client.clientId);
  return { ...client, user: u, token: signToken({ role: "client", userId: u.userId, clientId: client.clientId }) };
}

async function makeGig(name: string, data: { bio?: string; skills?: string[] } = {}) {
  const u = await user("gig_professional", name);
  const gig = await prisma.gigProfessionalProfile.create({
    data: {
      userId: u.userId,
      ...(data.bio ? { bio: data.bio } : {}),
      ...(data.skills ? { skills: { create: data.skills.map((skill) => ({ skill })) } } : {}),
    },
  });
  created.gigs.push(gig.gigProfileId);
  return { ...gig, user: u, token: signToken({ role: "gig_professional", userId: u.userId, gigProfileId: gig.gigProfileId }) };
}

function call(method: string, path: string, token?: string, body?: unknown) {
  return fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function json(method: string, path: string, token?: string, body?: unknown) {
  const res = await call(method, path, token, body);
  return { status: res.status, body: await res.json().catch(() => null) };
}

function assertNoSensitiveKeys(value: unknown, path = "response"): void {
  if (Array.isArray(value)) return value.forEach((item, i) => assertNoSensitiveKeys(item, `${path}[${i}]`));
  if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      assert.ok(!FORBIDDEN_KEYS.includes(key), `${path}.${key} must not be exposed`);
      assertNoSensitiveKeys(inner, `${path}.${key}`);
    }
  }
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
  await prisma.review.deleteMany({ where: { task } });
  await prisma.payment.deleteMany({ where: { task } });
  await prisma.gigManagerAssignment.deleteMany({ where: { task } });
  await prisma.application.deleteMany({ where: { task } });
  await prisma.task.deleteMany({ where: task });
  await prisma.service.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.client.deleteMany({ where: { clientId: { in: created.clients } } });
  await prisma.gigProfessionalProfile.deleteMany({ where: { gigProfileId: { in: created.gigs } } });
  await prisma.user.deleteMany({ where: { userId: { in: created.users } } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("client sees the correct profile for each of several applicants, without sensitive fields", async () => {
  const client = await makeClient("Acme", { domain: "Fintech" });
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} landing page`, budget: 2000 } });

  const alice = await makeGig("Alice Applicant", { bio: "React specialist", skills: ["React", "TypeScript"] });
  await prisma.profileTool.create({ data: { gigProfileId: alice.gigProfileId, tool: "Figma" } });
  await prisma.profilePortfolio.create({ data: { gigProfileId: alice.gigProfileId, url: "https://alice.example.test" } });
  await prisma.service.create({ data: { gigProfileId: alice.gigProfileId, title: "Landing pages", price: 1500, category: "dev" } });
  await prisma.service.create({ data: { gigProfileId: alice.gigProfileId, title: "Old archived service", price: 10, status: "archived" } });
  const bob = await makeGig("Bob Builder"); // incomplete profile: no bio, skills, tools, portfolio or services

  // Both apply through the real endpoint.
  assert.equal((await json("POST", "/gig/applications", alice.token, { taskId: task.taskId })).status, 201);
  assert.equal((await json("POST", "/gig/applications", bob.token, { taskId: task.taskId })).status, 201);
  const applications = (await json("GET", "/applications", client.token)).body as Array<{ applicationId: number; gigProfileId: number; taskId: number }>;
  const mine = applications.filter((a) => a.taskId === task.taskId);
  assert.equal(mine.length, 2);

  for (const application of mine) {
    const res = await json("GET", `/applications/${application.applicationId}/profile`, client.token);
    assert.equal(res.status, 200);
    assertNoSensitiveKeys(res.body);
    assert.equal(res.body.application.applicationId, application.applicationId);
    assert.equal(res.body.application.taskId, task.taskId);
    assert.equal(res.body.application.taskTitle, task.title);
    assert.equal(res.body.application.status, "pending");
    assert.equal(res.body.profile.gigProfileId, application.gigProfileId);

    if (application.gigProfileId === alice.gigProfileId) {
      assert.equal(res.body.profile.name, "Alice Applicant");
      assert.equal(res.body.profile.email, alice.user.email);
      assert.equal(res.body.profile.bio, "React specialist");
      assert.deepEqual([...res.body.profile.skills].sort(), ["React", "TypeScript"]);
      assert.deepEqual(res.body.profile.tools, ["Figma"]);
      assert.deepEqual(res.body.profile.portfolio, ["https://alice.example.test"]);
      // Only active services are listed, with price as a number.
      assert.deepEqual(res.body.profile.services.map((s: { title: string; price: number }) => [s.title, s.price]), [["Landing pages", 1500]]);
    } else {
      assert.equal(application.gigProfileId, bob.gigProfileId);
      assert.equal(res.body.profile.name, "Bob Builder");
      // Incomplete profile comes back as explicit empties, not missing keys.
      assert.equal(res.body.profile.bio, null);
      assert.equal(res.body.profile.badge, null);
      assert.deepEqual(res.body.profile.skills, []);
      assert.deepEqual(res.body.profile.tools, []);
      assert.deepEqual(res.body.profile.portfolio, []);
      assert.deepEqual(res.body.profile.services, []);
      assert.deepEqual(res.body.profile.rating, { average: null, count: 0 });
      assert.deepEqual(res.body.profile.recentReviews, []);
      assert.equal(res.body.profile.stats.completedProjects, 0);
    }
  }
});

test("applicant profile is restricted to the task owner and the client role", async () => {
  const owner = await makeClient("Owner");
  const other = await makeClient("Other");
  const gig = await makeGig("Gail");
  const task = await prisma.task.create({ data: { clientId: owner.clientId, title: `${tag} owner task`, budget: 1000 } });
  const application = await prisma.application.create({ data: { gigProfileId: gig.gigProfileId, taskId: task.taskId } });
  const path = `/applications/${application.applicationId}/profile`;

  assert.equal((await json("GET", path, owner.token)).status, 200);
  assert.equal((await json("GET", path, other.token)).status, 404, "another client's application is indistinguishable from a missing one");
  assert.equal((await json("GET", path, gig.token)).status, 403, "gig professionals can't use the client endpoint");
  assert.equal((await json("GET", path)).status, 401);
  assert.equal((await json("GET", "/applications/not-a-number/profile", owner.token)).status, 400);
  assert.equal((await json("GET", "/applications/2000000000/profile", owner.token)).status, 404);
});

test("gig professional sees the task's real client; contact details only after being hired", async () => {
  const client = await makeClient("Brandt", { domain: "Healthcare", kycStatus: "VERIFIED" });
  const decoyClient = await makeClient("Decoy");
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} api work`, budget: 3000 } });
  await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} second open task`, budget: 1000 } });
  await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} service hire`, budget: 500, skills: ["Service Hire"] } });
  const decoyTask = await prisma.task.create({ data: { clientId: decoyClient.clientId, title: `${tag} decoy`, budget: 1000 } });
  const gig = await makeGig("Gina");
  const outsider = await makeGig("Oscar Outsider");

  assert.equal((await json("POST", "/gig/applications", gig.token, { taskId: task.taskId })).status, 201);
  const path = `/gig/tasks/${task.taskId}/client-profile`;

  const before = await json("GET", path, gig.token);
  assert.equal(before.status, 200);
  assertNoSensitiveKeys(before.body);
  assert.deepEqual(before.body.task, { taskId: task.taskId, title: task.title });
  assert.equal(before.body.application.taskId, task.taskId);
  assert.equal(before.body.application.status, "pending");
  assert.equal(before.body.hiredOnTask, false);
  assert.equal(before.body.profile.clientId, client.clientId);
  assert.equal(before.body.profile.organizationName, "Brandt Co");
  assert.equal(before.body.profile.domain, "Healthcare");
  assert.equal(before.body.profile.contactName, "Brandt");
  assert.equal(before.body.profile.isVerified, true);
  assert.equal(before.body.profile.contactEmail, null, "applicants don't get the client's email");
  // Service-hire tasks are private, so they aren't counted as posted marketplace tasks.
  assert.deepEqual(before.body.profile.stats, { tasksPosted: 2, openTasks: 2, professionalsHired: 0 });
  assert.ok(!JSON.stringify(before.body).includes(client.user.email), "client email must not leak anywhere in the response");

  // Not applied to this task (or applied elsewhere) => 404; wrong role => 403; no token => 401.
  assert.equal((await json("GET", path, outsider.token)).status, 404);
  assert.equal((await json("GET", `/gig/tasks/${decoyTask.taskId}/client-profile`, gig.token)).status, 404);
  assert.equal((await json("GET", path, client.token)).status, 403);
  assert.equal((await json("GET", path)).status, 401);
  assert.equal((await json("GET", "/gig/tasks/abc/client-profile", gig.token)).status, 400);

  // The client hires the professional through the existing accept flow.
  const application = await prisma.application.findFirstOrThrow({ where: { taskId: task.taskId, gigProfileId: gig.gigProfileId } });
  assert.equal((await json("PATCH", `/applications/${application.applicationId}`, client.token, { status: "accepted" })).status, 200);

  const after = await json("GET", path, gig.token);
  assert.equal(after.status, 200);
  assert.equal(after.body.application.status, "accepted");
  assert.equal(after.body.hiredOnTask, true);
  assert.equal(after.body.profile.contactEmail, client.user.email);
  assert.equal(after.body.profile.stats.professionalsHired, 1);
});

test("a hire recorded without an application row (older data) can still view the client", async () => {
  const client = await makeClient("Legacy");
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} legacy hire`, budget: 1000, status: "in_progress" } });
  const gig = await makeGig("Lee");
  await prisma.gigManagerAssignment.create({ data: { gigProfileId: gig.gigProfileId, taskId: task.taskId } });

  const res = await json("GET", `/gig/tasks/${task.taskId}/client-profile`, gig.token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.task, { taskId: task.taskId, title: task.title });
  assert.equal(res.body.application, null);
  assert.equal(res.body.hiredOnTask, true);
  assert.equal(res.body.profile.clientId, client.clientId);
  assert.equal(res.body.profile.contactEmail, client.user.email);
});

test("ratings use only published reviews; incomplete client profiles return explicit empties", async () => {
  const client = await makeClient("Rated"); // no domain, KYC pending
  const task = await prisma.task.create({ data: { clientId: client.clientId, title: `${tag} rated task`, budget: 1000 } });
  const gig = await makeGig("Reviewer Ray");
  const second = await makeGig("Reviewer Rita");
  await prisma.application.create({ data: { gigProfileId: gig.gigProfileId, taskId: task.taskId, status: "declined" } });

  await prisma.review.create({ data: { taskId: task.taskId, reviewerId: gig.userId, revieweeId: client.userId, rating: 4, comment: "Clear brief" } });
  await prisma.review.create({ data: { taskId: task.taskId, reviewerId: second.userId, revieweeId: client.userId, rating: 1, comment: "flagged", status: "FLAGGED" } });

  // A declined applicant can still look up who posted the task they applied to.
  const res = await json("GET", `/gig/tasks/${task.taskId}/client-profile`, gig.token);
  assert.equal(res.status, 200);
  assert.equal(res.body.application.status, "declined");
  assert.equal(res.body.profile.domain, null);
  assert.equal(res.body.profile.isVerified, false);
  assert.equal(res.body.profile.contactEmail, null);
  assert.deepEqual(res.body.profile.rating, { average: 4, count: 1 });
  assert.equal(res.body.profile.recentReviews.length, 1);
  assert.equal(res.body.profile.recentReviews[0].comment, "Clear brief");
  assert.equal(res.body.profile.recentReviews[0].reviewerName, "Reviewer Ray");
  assert.equal(res.body.profile.recentReviews[0].taskTitle, task.title);
});

test("applied-task listing carries the task details shown in the applied task section", async () => {
  const client = await makeClient("Detail");
  const task = await prisma.task.create({
    data: { clientId: client.clientId, title: `${tag} detailed`, budget: 4500, category: "dev", duration: "2 weeks", skills: ["Node"], dueDate: new Date("2027-01-15") },
  });
  const gig = await makeGig("Dee");
  await prisma.application.create({ data: { gigProfileId: gig.gigProfileId, taskId: task.taskId } });

  const res = await json("GET", "/gig/applications/mine", gig.token);
  assert.equal(res.status, 200);
  const listed = res.body.find((a: { taskId: number }) => a.taskId === task.taskId);
  assert.equal(listed.task.client.clientId, client.clientId);
  assert.equal(listed.task.category, "dev");
  assert.equal(listed.task.duration, "2 weeks");
  assert.deepEqual(listed.task.skills, ["Node"]);
  assert.equal(listed.task.dueDate.slice(0, 10), "2027-01-15");
});
