/**
 * Gig-facing response shapes. gigApi.ts (frontend) expects snake_case keys,
 * STRING ids, and UPPERCASE enum values — the opposite dialect from
 * manager.serializer.ts for the same underlying rows. This is the one place
 * that flattens Prisma's relational includes into exactly that shape.
 */
import type {
  Application as DbApplication,
  Client as DbClient,
  Deliverable as DbDeliverable,
  GigProfessionalProfile as DbGigProfile,
  Payment as DbPayment,
  Review as DbReview,
  Service as DbService,
  Task as DbTask,
  User as DbUserWithPassword,
} from "db";

// The shared PrismaClient (db/index.ts) globally omits User.hashPassword, so
// every query result actually matches this, not the full generated model.
type DbUser = Omit<DbUserWithPassword, "hashPassword">;

function upper<T extends string>(value: T): Uppercase<T> {
  return value.toUpperCase() as Uppercase<T>;
}

type TaskWithClient = DbTask & { client?: (DbClient & { user?: DbUser }) | null };

/**
 * The frontend mock puts a display label ("cli-01 (TechCorp Solutions)") in
 * client_id, not a real id. Reproduced approximately as "<id> (<name>)" —
 * a real backend can't fabricate the mock's exact string, and this is
 * flagged as a known divergence.
 */
function clientLabel(task: TaskWithClient): string {
  return task.client ? `${task.client.clientId} (${task.client.clientName})` : String(task.clientId);
}

export function serializeTask(task: TaskWithClient) {
  return {
    task_id: String(task.taskId),
    title: task.title,
    description: task.description ?? "",
    client_id: clientLabel(task),
    budget: Number(task.budget),
    status: upper(task.status),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

type ApplicationWithTask = DbApplication & { task?: TaskWithClient | null };

export function serializePendingRequest(application: ApplicationWithTask) {
  return {
    application_id: String(application.applicationId),
    task_id: String(application.taskId),
    gig_profile_id: String(application.gigProfileId),
    status: upper(application.status),
    createdAt: application.createdAt.toISOString(),
    ...(application.task
      ? { budget: Number(application.task.budget), task: serializeTask(application.task) }
      : {}),
  };
}

/**
 * content <-> DELIVERABLE.description (the substantive text), notes <->
 * submission_path. See gig.service.ts submitDeliverable for the write side
 * of this mapping. The frontend's GigDeliverable type has no status field
 * at all; it's included anyway since extra fields the frontend doesn't
 * declare are harmless, unlike missing ones.
 */
export function serializeDeliverable(deliverable: DbDeliverable) {
  return {
    deliverable_id: `${deliverable.taskId}-${deliverable.deliverableNo}`,
    deliverable_no: deliverable.deliverableNo,
    task_id: String(deliverable.taskId),
    gig_profile_id: String(deliverable.gigProfileId),
    content: deliverable.description,
    notes: deliverable.submissionPath,
    status: upper(deliverable.status),
    createdAt: deliverable.createdAt.toISOString(),
  };
}

type GigProfileWithRelations = DbGigProfile & {
  user: DbUser;
  skills?: { skill: string }[];
  tools?: { tool: string }[];
  portfolio?: { url: string }[];
};

/**
 * rating / jobSuccessRate / completedProjectsCount have no derivation basis
 * (jobSuccessRate especially — nothing in the schema resembles a success
 * rate). Only pass computed stats explicitly provided by the caller;
 * never fabricate a number for a field with no backing data.
 */
export function serializeGigProfile(
  profile: GigProfileWithRelations,
  stats?: { rating?: number; completedProjectsCount?: number },
) {
  return {
    gig_profile_id: String(profile.gigProfileId),
    user_id: String(profile.userId),
    name: profile.user.name,
    email: profile.user.email,
    bio: profile.bio ?? "",
    skills: (profile.skills ?? []).map((s: { skill: string }) => s.skill),
    portfolio: (profile.portfolio ?? []).map((p: { url: string }) => p.url),
    tools: (profile.tools ?? []).map((t: { tool: string }) => t.tool),
    ...(stats?.rating !== undefined ? { rating: stats.rating } : {}),
    ...(stats?.completedProjectsCount !== undefined
      ? { completedProjectsCount: stats.completedProjectsCount }
      : {}),
  };
}

type ServiceWithTags = DbService & { tags?: { tag: string }[] };

export function serializeService(service: ServiceWithTags) {
  return {
    service_id: String(service.serviceId),
    gig_profile_id: String(service.gigProfileId),
    title: service.title,
    description: service.description ?? "",
    price: Number(service.price),
    tags: (service.tags ?? []).map((t: { tag: string }) => t.tag),
    ...(service.thumbnail ? { thumbnail: service.thumbnail } : {}),
    createdAt: service.createdAt.toISOString(),
  };
}

/** PaymentTransaction.paidAt has no DB column — Payment has status + createdAt only, no separate paid-at timestamp. Reusing createdAt rather than inventing a value. */
export function serializePayment(payment: DbPayment) {
  return {
    payment_id: String(payment.paymentId),
    task_id: String(payment.taskId),
    gig_profile_id: String(payment.gigProfileId),
    amount: Number(payment.amount),
    paidAt: payment.createdAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

type ReviewWithReviewer = DbReview & { reviewer?: DbUser | null };

export function serializeReview(review: ReviewWithReviewer) {
  return {
    review_id: String(review.reviewId),
    rating: review.rating,
    comment: review.comment ?? undefined,
    client_name: review.reviewer?.name,
    createdAt: review.createdAt.toISOString(),
  };
}

type CompletedTaskSource = TaskWithClient & {
  reviews?: ReviewWithReviewer[];
  payments?: DbPayment[];
};

/** completedAt has no dedicated column — updatedAt (added in the Phase 1 schema pass) doubles as a proxy since it changes whenever the task flips to completed. */
export function serializeCompletedProject(task: CompletedTaskSource) {
  return {
    task_id: String(task.taskId),
    title: task.title,
    description: task.description ?? "",
    client_id: clientLabel(task),
    budget: Number(task.budget),
    status: "COMPLETED" as const,
    completedAt: task.updatedAt.toISOString(),
    reviews: (task.reviews ?? []).map(serializeReview),
    ...(task.payments?.[0] ? { payment: serializePayment(task.payments[0]) } : {}),
  };
}
