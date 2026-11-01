/**
 * Platform settings live in one PLATFORM_SETTINGS row, so they survive restarts
 * and are shared by every API instance. Read straight from the DB: the table is
 * one row and an admin's change must apply on the very next request everywhere.
 */
import { prisma } from "db";

export interface PlatformSettingsValue {
  /** Percent added on top of the gig amount. Snapshotted onto each PAYMENT at hire time. */
  commissionRakePercent: number;
  /** Tasks below this budget are rejected when posted. */
  minimumTaskBudget: number;
  /** Funding is rejected when gig amount + fee exceeds this. */
  maxEscrowThreshold: number;
  /** Suggested taxonomy. Stored and editable; not yet enforced on task creation. */
  allowedCategories: string[];
  /** When true, non-admin writes get 503 (see maintenanceGuard). */
  maintenanceMode: boolean;
}

export const DEFAULT_SETTINGS: PlatformSettingsValue = {
  commissionRakePercent: 10,
  minimumTaskBudget: 50,
  maxEscrowThreshold: 1_000_000,
  allowedCategories: [
    "Software Development",
    "AI & Data Science",
    "UI/UX & Product Design",
    "DevOps & Cloud Engineering",
    "Mobile App Development",
    "Cybersecurity",
  ],
  maintenanceMode: false,
};

/** Stored values over defaults, so a setting added in a later release has a value on old rows. */
export async function getPlatformSettings(): Promise<PlatformSettingsValue> {
  const row = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  return { ...DEFAULT_SETTINGS, ...((row?.value ?? {}) as Partial<PlatformSettingsValue>) };
}

/** Merge a schema-validated patch (known keys only) and persist the singleton row. */
export async function updatePlatformSettings(
  patch: { [K in keyof PlatformSettingsValue]?: PlatformSettingsValue[K] | undefined },
): Promise<PlatformSettingsValue> {
  const known = Object.entries(patch).filter(([, v]) => v !== undefined);
  const value = { ...(await getPlatformSettings()), ...Object.fromEntries(known) };
  await prisma.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, value: value as object },
    update: { value: value as object },
  });
  return value;
}
