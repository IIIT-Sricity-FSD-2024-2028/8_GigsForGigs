/**
 * Read-only profiles that one side of a task may see of the other side:
 *  - a client viewing a gig professional who applied to one of their tasks;
 *  - a gig professional viewing the client whose task they applied to.
 *
 * Callers (client.service / gig.service) decide WHETHER the viewer may see a
 * profile, always from an APPLICATION row, never from a bare user id in the
 * URL. This module decides WHAT they see. Every query uses an explicit
 * `select` allow-list rather than `include`, so account internals (password
 * hash, TOTP secret, token version, admin tier/permissions, account status)
 * can never leak, even if the USERS table gains new columns later.
 */
import { prisma } from "db";
import { SERVICE_HIRE_SKILL, SETTLED_PAYMENT_STATUSES } from "../../lib/taskRules.js";

const RECENT_REVIEW_LIMIT = 3;

type ApplicationStatus = "pending" | "accepted" | "declined" | "shortlisted" | "withdrawn" | "removed";

/** The application that links the viewer to the profile, so the UI can show which task it came from. */
export interface ApplicationContext {
  applicationId: number;
  taskId: number;
  taskTitle: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export function toApplicationContext(application: {
  applicationId: number;
  status: ApplicationStatus;
  createdAt: Date;
  task: { taskId: number; title: string };
}): ApplicationContext {
  return {
    applicationId: application.applicationId,
    taskId: application.task.taskId,
    taskTitle: application.task.title,
    status: application.status,
    appliedAt: application.createdAt.toISOString(),
  };
}

/**
 * Average rating, count and the latest few reviews someone has received.
 * Only PUBLISHED reviews count: FLAGGED/HIDDEN ones are under moderation.
 */
async function reviewSummary(revieweeUserId: number) {
  const where = { revieweeId: revieweeUserId, status: "PUBLISHED" };
  const [aggregate, recent] = await Promise.all([
    prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: RECENT_REVIEW_LIMIT,
      select: {
        reviewId: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),
  ]);
  const average = aggregate._avg.rating;
  return {
    rating: {
      average: average == null ? null : Math.round(Number(average) * 10) / 10,
      count: aggregate._count._all,
    },
    recentReviews: recent.map((review) => ({
      reviewId: review.reviewId,
      rating: review.rating,
      comment: review.comment ?? null,
      reviewerName: review.reviewer.name,
      taskTitle: review.task.title,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}

/** A gig professional's profile as shown to a client they applied to. */
export async function getPublicGigProfile(gigProfileId: number) {
  const profile = await prisma.gigProfessionalProfile.findUniqueOrThrow({
    where: { gigProfileId },
    select: {
      gigProfileId: true,
      bio: true,
      badge: true,
      user: { select: { userId: true, name: true, email: true, createdAt: true } },
      skills: { select: { skill: true } },
      tools: { select: { tool: true } },
      portfolio: { select: { url: true } },
      services: {
        where: { status: "active" },
        select: { serviceId: true, title: true, price: true, category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const [reviews, completedProjects] = await Promise.all([
    reviewSummary(profile.user.userId),
    prisma.payment.count({ where: { gigProfileId, status: { in: [...SETTLED_PAYMENT_STATUSES] } } }),
  ]);

  return {
    gigProfileId: profile.gigProfileId,
    name: profile.user.name,
    // Applicants share their contact email with the client by applying; /applications already returns it.
    email: profile.user.email,
    bio: profile.bio || null,
    badge: profile.badge || null,
    memberSince: profile.user.createdAt.toISOString(),
    skills: profile.skills.map((s) => s.skill),
    tools: profile.tools.map((t) => t.tool),
    portfolio: profile.portfolio.map((p) => p.url),
    services: profile.services.map((service) => ({
      serviceId: service.serviceId,
      title: service.title,
      price: Number(service.price),
      category: service.category ?? null,
    })),
    stats: { completedProjects },
    ...reviews,
  };
}

/**
 * A client's profile as shown to a gig professional who applied to their task.
 * `includeContact` is true only once the client has hired this professional:
 * applicants see the organisation, hired professionals can also reach its contact.
 */
export async function getPublicClientProfile(clientId: number, { includeContact }: { includeContact: boolean }) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { clientId },
    select: {
      clientId: true,
      clientName: true,
      domain: true,
      kycStatus: true,
      user: { select: { userId: true, name: true, email: true, createdAt: true } },
    },
  });

  const marketplaceTask = { clientId, NOT: { skills: { has: SERVICE_HIRE_SKILL } } };
  const [reviews, tasksPosted, openTasks, professionalsHired] = await Promise.all([
    reviewSummary(client.user.userId),
    prisma.task.count({ where: marketplaceTask }),
    prisma.task.count({ where: { ...marketplaceTask, status: "open" } }),
    prisma.application.count({ where: { status: "accepted", task: { clientId } } }),
  ]);

  return {
    clientId: client.clientId,
    organizationName: client.clientName,
    domain: client.domain || null,
    contactName: client.user.name,
    contactEmail: includeContact ? client.user.email : null,
    isVerified: client.kycStatus === "VERIFIED",
    memberSince: client.user.createdAt.toISOString(),
    stats: { tasksPosted, openTasks, professionalsHired },
    ...reviews,
  };
}
