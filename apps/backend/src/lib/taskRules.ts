/**
 * Single source of truth for task/deliverable business rules that more than
 * one module needs (client, gig, manager, payment). Keep rule changes here.
 */
import { prisma } from "db";

/**
 * Tasks created by "hire this service" carry this skill tag. TASKS has no FK
 * to SERVICE/SERVICE_REQUEST, so the tag is what separates a client-initiated
 * service hire (the gig pro accepts it) from a marketplace task (the client
 * accepts the gig pro). Clients can't set it themselves — see stripReservedSkills.
 */
export const SERVICE_HIRE_SKILL = "Service Hire";

export function isServiceHireTask(task: { skills: string[] }): boolean {
  return task.skills.includes(SERVICE_HIRE_SKILL);
}

export function stripReservedSkills(skills: string[] | undefined): string[] | undefined {
  return skills?.filter((s) => s !== SERVICE_HIRE_SKILL);
}

const DONE = new Set(["approved", "closed"]);

type DefinitionWithLatest = { submissions: Array<{ submission: { status: string } }> };

/**
 * Progress = definitions whose LATEST submission is approved/closed ÷ all
 * definitions. Callers must load submissions ordered by deliverableNo desc so
 * submissions[0] is the latest. Falls back to raw deliverables when the
 * client hasn't defined any scope items.
 */
export function computeProgress(
  definitions: DefinitionWithLatest[],
  deliverables: Array<{ status: string }>,
): number {
  if (definitions.length > 0) {
    const done = definitions.filter((d) => DONE.has(d.submissions[0]?.submission.status ?? "")).length;
    return Math.round((done / definitions.length) * 100);
  }
  if (deliverables.length === 0) return 0;
  const done = deliverables.filter((d) => DONE.has(d.status)).length;
  return Math.round((done / deliverables.length) * 100);
}

export const latestSubmissionInclude = {
  submissions: {
    include: { submission: { select: { deliverableNo: true, status: true } } },
    orderBy: { deliverableNo: "desc" },
  },
} as const;

/** True once every required deliverable is approved/closed (and there is at least one). */
export async function isTaskWorkComplete(taskId: number): Promise<boolean> {
  const [definitions, deliverables] = await Promise.all([
    prisma.taskDeliverableDefinition.findMany({ where: { taskId }, include: latestSubmissionInclude }),
    prisma.deliverable.findMany({ where: { taskId }, select: { status: true } }),
  ]);
  if (definitions.length === 0 && deliverables.length === 0) return false;
  return computeProgress(definitions, deliverables) === 100;
}
