import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../app.js";
import { signToken } from "./jwt.js";
import { prisma } from "db";
import { toContractReviewResponse } from "../modules/client/client.service.js";
import { toReviewResponse } from "../modules/gig/gig.controller.js";
import { createClientReviewSchema } from "../modules/client/client.dto.js";
import { createReviewSchema as createGigReviewSchema } from "../modules/gig/gig.dto.js";

let server: Server;
let baseUrl: string;

const TEST_TASK_ID = 94;

before(async () => {
  // Clean up any lingering test reviews on TEST_TASK_ID
  await prisma.review.deleteMany({
    where: { taskId: TEST_TASK_ID },
  });
  await prisma.review.deleteMany({
    where: { comment: { in: ["Duplicate attempt", "Integration test client review", "Integration test gig review"] } },
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await prisma.review.deleteMany({
    where: { taskId: TEST_TASK_ID },
  });
  await prisma.review.deleteMany({
    where: { comment: { in: ["Duplicate attempt", "Integration test client review", "Integration test gig review"] } },
  });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// Scenario 10: Backend schema validation for rating boundaries
test("Scenario 10: Invalid ratings are rejected by Zod schemas", () => {
  for (const rating of [0, 6, -1, 2.5, "invalid", null]) {
    const clientRes = createClientReviewSchema.safeParse({ taskId: 1, rating, comment: "Good work" });
    assert.equal(clientRes.success, false, `Client schema should reject rating: ${rating}`);

    const gigRes = createGigReviewSchema.safeParse({ taskId: 1, rating, comment: "Good client" });
    assert.equal(gigRes.success, false, `Gig schema should reject rating: ${rating}`);
  }

  for (const rating of [1, 2, 3, 4, 5, "1", "5"]) {
    const clientRes = createClientReviewSchema.safeParse({ taskId: 1, rating, comment: "Good work" });
    assert.equal(clientRes.success, true, `Client schema should accept rating: ${rating}`);

    const gigRes = createGigReviewSchema.safeParse({ taskId: 1, rating, comment: "Good client" });
    assert.equal(gigRes.success, true, `Gig schema should accept rating: ${rating}`);
  }
});

// Scenario 11: Optional comments and validation rules
test("Scenario 11: Optional comments are handled according to backend validation", () => {
  // Optional / omitted comment
  const noCommentClient = createClientReviewSchema.safeParse({ taskId: 1, rating: 5 });
  assert.equal(noCommentClient.success, true, "Client review without comment should be accepted");

  const noCommentGig = createGigReviewSchema.safeParse({ taskId: 1, rating: 4 });
  assert.equal(noCommentGig.success, true, "Gig review without comment should be accepted");

  // Valid comment up to 1000 characters
  const validComment = "Great collaboration! Requirements were clear and feedback was provided promptly.";
  assert.equal(createClientReviewSchema.safeParse({ taskId: 1, rating: 5, comment: validComment }).success, true);
  assert.equal(createGigReviewSchema.safeParse({ taskId: 1, rating: 5, comment: validComment }).success, true);

  // Comment exceeding 1000 characters
  const overlongComment = "A".repeat(1001);
  assert.equal(createClientReviewSchema.safeParse({ taskId: 1, rating: 5, comment: overlongComment }).success, false);
  assert.equal(createGigReviewSchema.safeParse({ taskId: 1, rating: 5, comment: overlongComment }).success, false);

  // HTML / Code injection blocked
  const injection = "<script>alert('xss')</script>";
  assert.equal(createClientReviewSchema.safeParse({ taskId: 1, rating: 5, comment: injection }).success, false);
  assert.equal(createGigReviewSchema.safeParse({ taskId: 1, rating: 5, comment: injection }).success, false);
});

// Scenario 12: Authentication and role-based access
test("Scenario 12: Unauthenticated requests and cross-role requests are rejected", async () => {
  // 1. Missing Authorization header -> 401 Unauthorized
  const noAuthClient = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId: 1, rating: 5 }),
  });
  assert.equal(noAuthClient.status, 401);

  const noAuthGig = await fetch(`${baseUrl}/api/gig/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId: 1, rating: 5 }),
  });
  assert.equal(noAuthGig.status, 401);

  // 2. Client role attempting to access Gig reviews endpoint -> 403 Forbidden
  const realClient = await prisma.user.findFirst({
    where: { role: "client", client: { isNot: null } },
    include: { client: true },
  });
  assert.ok(realClient?.client, "Real client should exist in DB");

  const clientToken = signToken({
    role: "client",
    userId: realClient.userId,
    clientId: realClient.client.clientId,
  });

  const clientOnGigEndpoint = await fetch(`${baseUrl}/api/gig/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ taskId: 1, rating: 5 }),
  });
  assert.equal(clientOnGigEndpoint.status, 403);

  // 3. Gig Pro role attempting to access Client reviews endpoint -> 403 Forbidden
  const realGig = await prisma.user.findFirst({
    where: { role: "gig_professional", gigProfile: { isNot: null } },
    include: { gigProfile: true },
  });
  assert.ok(realGig?.gigProfile, "Real gig pro should exist in DB");

  const gigToken = signToken({
    role: "gig_professional",
    userId: realGig.userId,
    gigProfileId: realGig.gigProfile.gigProfileId,
  });

  const gigOnClientEndpoint = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gigToken}`,
    },
    body: JSON.stringify({ taskId: 1, rating: 5 }),
  });
  assert.equal(gigOnClientEndpoint.status, 403);
});

// Scenario 7: Client cannot review a task they do not own
test("Scenario 7: Client cannot review a task they do not own", async () => {
  const task = await prisma.task.findFirst({
    where: { status: "completed" },
    select: { taskId: true, clientId: true },
  });
  assert.ok(task, "Completed task should exist");

  const allClients = await prisma.client.findMany({
    where: { clientId: { not: task.clientId } },
    include: { user: true },
    take: 1,
  });
  assert.ok(allClients.length > 0, "Other client should exist");
  const otherClient = allClients[0];
  assert.ok(otherClient, "Other client should exist");

  const clientToken = signToken({
    role: "client",
    userId: otherClient.userId,
    clientId: otherClient.clientId,
  });

  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ taskId: task.taskId, rating: 5, comment: "Unauthorized review" }),
  });
  // Service throws notFound("Task not found") when task doesn't belong to caller's clientId -> 404
  assert.equal(res.status, 404);
});

// Scenario 8: Gig Professional cannot review a task to which they were not assigned
test("Scenario 8: Gig Professional cannot review a task to which they were not assigned", async () => {
  const task = await prisma.task.findFirst({
    where: { status: "completed" },
    include: { assignments: true },
  });
  assert.ok(task, "Completed task should exist");

  const assignedProfileIds = task.assignments.map((a) => a.gigProfileId);
  const unassignedProfiles = await prisma.gigProfessionalProfile.findMany({
    where: { gigProfileId: { notIn: assignedProfileIds } },
    include: { user: true },
    take: 1,
  });
  const unassignedGig = unassignedProfiles[0];
  assert.ok(unassignedGig, "Unassigned gig professional should exist");

  const gigToken = signToken({
    role: "gig_professional",
    userId: unassignedGig.userId,
    gigProfileId: unassignedGig.gigProfileId,
  });

  const res = await fetch(`${baseUrl}/api/gig/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gigToken}`,
    },
    body: JSON.stringify({ taskId: task.taskId, rating: 5, comment: "Unauthorized gig review" }),
  });
  // Service throws notFound("Task not found") when task is not assigned to caller's gigProfileId -> 404
  assert.equal(res.status, 404);
});

// Scenario 9: Incomplete tasks cannot be reviewed
test("Scenario 9: Incomplete tasks cannot be reviewed", async () => {
  const inProgressTask = await prisma.task.findFirst({
    where: { status: "in_progress" },
    include: { client: true },
  });

  if (inProgressTask) {
    const clientToken = signToken({
      role: "client",
      userId: inProgressTask.client.userId,
      clientId: inProgressTask.clientId,
    });
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({ taskId: inProgressTask.taskId, rating: 5 }),
    });
    // Task status !== "completed" -> 409 Conflict
    assert.equal(res.status, 409);
    const json = (await res.json()) as { message?: string };
    assert.match(json.message ?? "", /completed/i);
  }
});

// Scenario 1, 2, 3, 4, 6: Two-sided review submission, retrieval, and duplicate protection
test("Scenario 1, 2, 3, 4, 6: Complete two-sided review lifecycle and duplicate protection", async () => {
  const task = await prisma.task.findUnique({
    where: { taskId: TEST_TASK_ID },
    include: {
      client: true,
      assignments: { include: { gigProfile: true } },
      applications: { where: { status: "accepted" }, include: { gigProfile: true } },
    },
  });

  assert.ok(task, `Task ${TEST_TASK_ID} must exist for integration lifecycle test`);
  const hiredGig = task.assignments[0];
  assert.ok(hiredGig, `Task ${TEST_TASK_ID} must have an assigned gig professional`);

  const clientToken = signToken({
    role: "client",
    userId: task.client.userId,
    clientId: task.clientId,
  });

  const gigToken = signToken({
    role: "gig_professional",
    userId: hiredGig.gigProfile.userId,
    gigProfileId: hiredGig.gigProfileId,
  });

  // 1. Eligible Client submits a review successfully (Scenario 1)
  const clientReviewRes = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ taskId: TEST_TASK_ID, rating: 5, comment: "Integration test client review" }),
  });
  assert.equal(clientReviewRes.status, 201, "Client review should return 201 Created");

  // 2. Client refetches contracts -> review is present (Scenario 2)
  const contractsRes = await fetch(`${baseUrl}/api/contracts`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.equal(contractsRes.status, 200);
  const contracts = (await contractsRes.json()) as Array<{ taskId: number; reviews?: Array<{ reviewerId: number; revieweeId: number; rating: number; comment?: string }> }>;
  const myContract = contracts.find((c) => c.taskId === TEST_TASK_ID);
  assert.ok(myContract, "Contract for task should exist in contracts response");
  const clientReviewInContract = myContract.reviews?.find((r) => r.reviewerId === task.client.userId);
  assert.ok(clientReviewInContract, "Client review must be present in contract");
  assert.equal(clientReviewInContract.rating, 5);
  assert.equal(clientReviewInContract.revieweeId, hiredGig.gigProfile.userId);

  // 3. Client duplicate review rejected with 409 Conflict (Scenario 6)
  const clientDuplicateRes = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ taskId: TEST_TASK_ID, rating: 5, comment: "Duplicate attempt" }),
  });
  assert.equal(clientDuplicateRes.status, 409, "Duplicate client review must return 409 Conflict");
  const dupClientJson = (await clientDuplicateRes.json()) as { message?: string };
  assert.match(dupClientJson.message ?? "", /already reviewed/i);

  // 4. Eligible Gig Professional submits a review successfully (Scenario 3)
  const gigReviewRes = await fetch(`${baseUrl}/api/gig/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${gigToken}` },
    body: JSON.stringify({ taskId: TEST_TASK_ID, rating: 4, comment: "Integration test gig review" }),
  });
  assert.equal(gigReviewRes.status, 201, "Gig review should return 201 Created");

  // 5. Gig Pro refetches completed projects -> both reviews are present (Scenario 4)
  const completedRes = await fetch(`${baseUrl}/api/gig/projects/completed`, {
    headers: { Authorization: `Bearer ${gigToken}` },
  });
  assert.equal(completedRes.status, 200);
  const completedProjects = (await completedRes.json()) as Array<{ taskId: number; reviews?: Array<{ reviewerId: number; revieweeId: number; rating: number; comment?: string }> }>;
  const myProject = completedProjects.find((p) => p.taskId === TEST_TASK_ID);
  assert.ok(myProject, "Completed project must exist in completed projects response");
  assert.equal(myProject.reviews?.length, 2, "Completed project should contain both reviews");

  const gigReviewInProject = myProject.reviews?.find((r) => r.reviewerId === hiredGig.gigProfile.userId);
  assert.ok(gigReviewInProject, "Gig Pro's review must be present");
  assert.equal(gigReviewInProject.rating, 4);
  assert.equal(gigReviewInProject.revieweeId, task.client.userId);

  // 6. Gig Pro duplicate review rejected with 409 Conflict (Scenario 6)
  const gigDuplicateRes = await fetch(`${baseUrl}/api/gig/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${gigToken}` },
    body: JSON.stringify({ taskId: TEST_TASK_ID, rating: 4, comment: "Duplicate gig attempt" }),
  });
  assert.equal(gigDuplicateRes.status, 409, "Duplicate gig pro review must return 409 Conflict");
  const dupGigJson = (await gigDuplicateRes.json()) as { message?: string };
  assert.match(dupGigJson.message ?? "", /already reviewed/i);

  // 7. Verify review direction on both sides (Scenario 5)
  // On Client side:
  const clientViewClientReview = myContract.reviews?.find((r) => r.reviewerId === task.client.userId);
  const clientViewGigReview = myContract.reviews?.find((r) => r.reviewerId !== task.client.userId && r.revieweeId === task.client.userId);
  assert.equal(clientViewClientReview?.rating, 5);

  // On Gig Pro side:
  const gigViewGigReview = myProject.reviews?.find((r) => r.reviewerId === hiredGig.gigProfile.userId);
  const gigViewClientReview = myProject.reviews?.find((r) => r.reviewerId !== hiredGig.gigProfile.userId && r.revieweeId === hiredGig.gigProfile.userId);
  assert.equal(gigViewGigReview?.rating, 4);
  assert.equal(gigViewClientReview?.rating, 5);
});

// Scenario 5: Review direction identification unit test
test("Scenario 5: Both sides display the correct review direction using reviewerId and revieweeId", () => {
  const clientUserId = 50;
  const gigUserId = 100;
  const taskId = 300;

  const mockReviews = [
    toContractReviewResponse({
      reviewId: 1,
      taskId,
      reviewerId: clientUserId,
      revieweeId: gigUserId,
      rating: 5,
      comment: "Client feedback for gig pro",
      createdAt: new Date(),
      reviewer: { userId: clientUserId, name: "Acme Corp" },
      reviewee: { userId: gigUserId, name: "Alice Developer" },
    }),
    toReviewResponse({
      reviewId: 2,
      taskId,
      reviewerId: gigUserId,
      revieweeId: clientUserId,
      rating: 4,
      comment: "Gig pro feedback for client",
      createdAt: new Date(),
      reviewer: { userId: gigUserId, name: "Alice Developer" },
      reviewee: { userId: clientUserId, name: "Acme Corp" },
    }),
  ];

  // From Client perspective (user.userId = 50):
  const clientOwnReview = mockReviews.find((r) => r.reviewerId === clientUserId);
  const clientReceivedReview = mockReviews.find((r) => r.reviewerId !== clientUserId && r.revieweeId === clientUserId);

  assert.equal(clientOwnReview?.reviewId, 1);
  assert.equal(clientOwnReview?.comment, "Client feedback for gig pro");
  assert.equal(clientReceivedReview?.reviewId, 2);
  assert.equal(clientReceivedReview?.comment, "Gig pro feedback for client");

  // From Gig Pro perspective (user.userId = 100):
  const gigOwnReview = mockReviews.find((r) => r.reviewerId === gigUserId);
  const gigReceivedReview = mockReviews.find((r) => r.reviewerId !== gigUserId && r.revieweeId === gigUserId);

  assert.equal(gigOwnReview?.reviewId, 2);
  assert.equal(gigOwnReview?.comment, "Gig pro feedback for client");
  assert.equal(gigReceivedReview?.reviewId, 1);
  assert.equal(gigReceivedReview?.comment, "Client feedback for gig pro");
});
