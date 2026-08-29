/**
 * Manager-facing response shapes. managerApi.ts (frontend) expects camelCase
 * keys, numeric ids, and lowercase enum values — this is the one place that
 * flattens Prisma's relational includes into exactly that shape. gigApi.ts
 * expects a different dialect for the same underlying rows; see
 * gig.serializer.ts.
 */
import type {
  Application as DbApplication,
  Deliverable as DbDeliverable,
  GigManagerAssignment as DbAssignment,
  GigProfessionalProfile as DbGigProfile,
  Manager as DbManager,
  Task as DbTask,
  User as DbUserWithPassword,
} from "db";

// The shared PrismaClient (db/index.ts) globally omits User.hashPassword, so
// every query result actually matches this, not the full generated model.
type DbUser = Omit<DbUserWithPassword, "hashPassword">;

type ApplicationWithGigProfile = DbApplication & {
  gigProfile?: (DbGigProfile & { user: DbUser }) | null;
};

type DeliverableWithGigProfile = DbDeliverable & {
  gigProfile?: (DbGigProfile & { user: DbUser }) | null;
};

type AssignmentWithGigProfile = DbAssignment & {
  gigProfile?:
    | (DbGigProfile & { user: DbUser; skills?: { skill: string }[] })
    | null;
};

type TaskWithRelations = DbTask & {
  client?: { clientId: number; clientName: string; domain: string | null } | null;
  assignments?: AssignmentWithGigProfile[];
  deliverables?: DbDeliverable[];
};

type ManagerWithRelations = DbManager & {
  user: DbUser;
  client?: { clientId: number; clientName: string; domain: string | null } | null;
};

type TalentSource = DbGigProfile & {
  user: DbUser;
  skills?: { skill: string }[];
  tools?: { tool: string }[];
  portfolio?: { url: string }[];
  services?: { price: unknown }[];
};

/**
 * Mirrors managerApi.ts's closeDeliverable fallback exactly:
 * round(count(status in {approved, closed}) / count(*) * 100).
 */
export function computeProgress(deliverables: { status: string }[]): number {
  if (deliverables.length === 0) return 0;
  const doneCount = deliverables.filter(
    (d) => d.status === "approved" || d.status === "closed",
  ).length;
  return Math.round((doneCount / deliverables.length) * 100);
}

export function serializeDeliverable(deliverable: DeliverableWithGigProfile) {
  return {
    taskId: deliverable.taskId,
    deliverableNo: deliverable.deliverableNo,
    gigProfileId: deliverable.gigProfileId,
    description: deliverable.description,
    submissionPath: deliverable.submissionPath,
    status: deliverable.status,
    createdAt: deliverable.createdAt.toISOString(),
    ...(deliverable.gigProfile
      ? { gigProfile: { user: { name: deliverable.gigProfile.user.name } } }
      : {}),
  };
}

export function serializeApplication(application: ApplicationWithGigProfile) {
  return {
    applicationId: application.applicationId,
    gigProfileId: application.gigProfileId,
    taskId: application.taskId,
    status: application.status,
    rating: application.rating,
    hourlyRate: application.hourlyRate !== null ? Number(application.hourlyRate) : null,
    createdAt: application.createdAt.toISOString(),
    ...(application.gigProfile
      ? { gigProfile: { user: { name: application.gigProfile.user.name } } }
      : {}),
  };
}

export function serializeTask(task: TaskWithRelations) {
  const deliverables = task.deliverables ?? [];
  return {
    taskId: task.taskId,
    clientId: task.clientId,
    title: task.title,
    description: task.description,
    budget: Number(task.budget),
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    status: task.status,
    progress: computeProgress(deliverables),
    ...(task.client
      ? {
          client: {
            clientId: task.client.clientId,
            clientName: task.client.clientName,
            domain: task.client.domain,
          },
        }
      : {}),
    assignments: (task.assignments ?? []).map((assignment: AssignmentWithGigProfile) => ({
      gigProfileId: assignment.gigProfileId,
      taskId: assignment.taskId,
      managerId: assignment.managerId,
      assignedAt: assignment.assignedAt.toISOString(),
      ...(assignment.gigProfile
        ? {
            gigProfile: {
              gigProfileId: assignment.gigProfile.gigProfileId,
              userId: assignment.gigProfile.userId,
              bio: assignment.gigProfile.bio,
              user: {
                userId: assignment.gigProfile.user.userId,
                name: assignment.gigProfile.user.name,
                email: assignment.gigProfile.user.email,
              },
              skills: (assignment.gigProfile.skills ?? []).map(
                (s: { skill: string }) => s.skill,
              ),
            },
          }
        : {}),
    })),
    deliverables: deliverables.map(serializeDeliverable),
  };
}

export function serializeManagerProfile(manager: ManagerWithRelations) {
  return {
    managerId: manager.managerId,
    userId: manager.userId,
    clientId: manager.clientId,
    user: {
      userId: manager.user.userId,
      name: manager.user.name,
      email: manager.user.email,
      role: manager.user.role,
    },
    ...(manager.client
      ? {
          client: {
            clientId: manager.client.clientId,
            clientName: manager.client.clientName,
            domain: manager.client.domain,
          },
        }
      : {}),
  };
}

/**
 * TalentProfile.status ('active'|'busy'|'offline') has no backing column —
 * there is no availability concept in the schema. Hardcoded 'active' until
 * that's modeled; documented as a known gap, not silently invented data.
 */
export function serializeTalent(profile: TalentSource) {
  const firstServicePrice = profile.services?.[0]?.price;
  return {
    gigProfileId: profile.gigProfileId,
    userId: profile.userId,
    name: profile.user.name,
    bio: profile.bio,
    ...(firstServicePrice !== undefined ? { price: Number(firstServicePrice) } : {}),
    skills: (profile.skills ?? []).map((s: { skill: string }) => s.skill),
    tools: (profile.tools ?? []).map((t: { tool: string }) => t.tool),
    portfolio: (profile.portfolio ?? []).map((p: { url: string }) => p.url),
    status: "active" as const,
  };
}
