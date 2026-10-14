import { test } from "node:test";
import assert from "node:assert/strict";
import { toContractReviewResponse } from "../modules/client/client.service.js";
import { toReviewResponse } from "../modules/gig/gig.controller.js";

test("toReviewResponse exposes review direction, reviewer/reviewee IDs and names", () => {
  const clientReviewRow = {
    reviewId: 101,
    taskId: 55,
    reviewerId: 1,
    revieweeId: 2,
    rating: 5,
    comment: "Outstanding work delivered ahead of schedule!",
    createdAt: new Date("2026-10-14T10:00:00.000Z"),
    reviewer: { userId: 1, name: "Alice Client" },
    reviewee: { userId: 2, name: "Bob Freelancer" },
  };

  const serializedClientReview = toReviewResponse(clientReviewRow);

  assert.equal(serializedClientReview.reviewId, 101);
  assert.equal(serializedClientReview.taskId, 55);
  assert.equal(serializedClientReview.reviewerId, 1);
  assert.equal(serializedClientReview.revieweeId, 2);
  assert.equal(serializedClientReview.reviewerName, "Alice Client");
  assert.equal(serializedClientReview.revieweeName, "Bob Freelancer");
  assert.equal(serializedClientReview.clientName, "Alice Client");
  assert.equal(serializedClientReview.rating, 5);
  assert.equal(serializedClientReview.comment, "Outstanding work delivered ahead of schedule!");
  assert.equal(serializedClientReview.createdAt, "2026-10-14T10:00:00.000Z");

  const gigReviewRow = {
    reviewId: 102,
    taskId: 55,
    reviewerId: 2,
    revieweeId: 1,
    rating: 4,
    comment: "Clear specifications and prompt communication.",
    createdAt: new Date("2026-10-14T12:00:00.000Z"),
    reviewer: { userId: 2, name: "Bob Freelancer" },
    reviewee: { userId: 1, name: "Alice Client" },
  };

  const serializedGigReview = toReviewResponse(gigReviewRow);

  assert.equal(serializedGigReview.reviewId, 102);
  assert.equal(serializedGigReview.taskId, 55);
  assert.equal(serializedGigReview.reviewerId, 2);
  assert.equal(serializedGigReview.revieweeId, 1);
  assert.equal(serializedGigReview.reviewerName, "Bob Freelancer");
  assert.equal(serializedGigReview.revieweeName, "Alice Client");
  assert.equal(serializedGigReview.rating, 4);
  assert.equal(serializedGigReview.comment, "Clear specifications and prompt communication.");
});

test("toContractReviewResponse correctly shapes reviews for Client contract view", () => {
  const row = {
    reviewId: 201,
    taskId: 60,
    reviewerId: 10,
    revieweeId: 20,
    rating: 5,
    comment: null,
    createdAt: new Date("2026-10-15T01:30:00.000Z"),
    reviewer: { userId: 10, name: "Acme Corp" },
    reviewee: { userId: 20, name: "John Pro" },
  };

  const result = toContractReviewResponse(row);

  assert.equal(result.reviewId, 201);
  assert.equal(result.taskId, 60);
  assert.equal(result.reviewerId, 10);
  assert.equal(result.revieweeId, 20);
  assert.equal(result.reviewerName, "Acme Corp");
  assert.equal(result.revieweeName, "John Pro");
  assert.equal(result.rating, 5);
  assert.equal(result.comment, undefined);
  assert.equal(result.createdAt, "2026-10-15T01:30:00.000Z");
});

test("review direction allows distinguishing Client reviews from Gig Pro reviews", () => {
  const clientUserId = 42;
  const gigUserId = 99;

  const reviews = [
    toContractReviewResponse({
      reviewId: 1,
      taskId: 100,
      reviewerId: clientUserId,
      revieweeId: gigUserId,
      rating: 5,
      comment: "Client feedback",
      createdAt: new Date("2026-10-15T00:00:00.000Z"),
      reviewer: { userId: clientUserId, name: "Client User" },
      reviewee: { userId: gigUserId, name: "Gig Pro User" },
    }),
    toContractReviewResponse({
      reviewId: 2,
      taskId: 100,
      reviewerId: gigUserId,
      revieweeId: clientUserId,
      rating: 4,
      comment: "Gig Pro feedback",
      createdAt: new Date("2026-10-15T01:00:00.000Z"),
      reviewer: { userId: gigUserId, name: "Gig Pro User" },
      reviewee: { userId: clientUserId, name: "Client User" },
    }),
  ];

  const clientReview = reviews.find((r) => r.reviewerId === clientUserId);
  const gigReview = reviews.find((r) => r.reviewerId === gigUserId);

  assert.ok(clientReview, "Client review should be identified by client's reviewerId");
  assert.equal(clientReview.revieweeId, gigUserId);
  assert.equal(clientReview.comment, "Client feedback");

  assert.ok(gigReview, "Gig Pro review should be identified by gig pro's reviewerId");
  assert.equal(gigReview.revieweeId, clientUserId);
  assert.equal(gigReview.comment, "Gig Pro feedback");
});
