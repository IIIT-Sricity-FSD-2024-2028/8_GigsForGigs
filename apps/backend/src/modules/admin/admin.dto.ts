import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../middleware/adminGuard.js";
import { MONEY_10_2, id, line, money, orgName, personName, saneDate, tag, tagList, text } from "../../lib/validation.js";

export const createUserSchema = z.object({
  name: personName(100),
  email: z.string().trim().email().max(100),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  // Not "admin": admin seats only come from invitations, which carry a tier and permissions.
  role: z.enum(["client", "gig_professional", "manager"]),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const createClientSchema = z.object({
  userId: id(),
  clientName: orgName(100),
  domain: text(100).optional(),
});
export type CreateClientDto = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  clientName: orgName(100).optional(),
  domain: text(100).optional(),
});
export type UpdateClientDto = z.infer<typeof updateClientSchema>;

export const createManagerSchema = z.object({
  userId: id(),
  clientId: id(),
});
export type CreateManagerDto = z.infer<typeof createManagerSchema>;

export const createGigProfileSchema = z.object({
  userId: id(),
  bio: text(5000).optional(),
});
export type CreateGigProfileDto = z.infer<typeof createGigProfileSchema>;

export const updateGigProfileSchema = z.object({ bio: text(5000).optional() });
export type UpdateGigProfileDto = z.infer<typeof updateGigProfileSchema>;

export const createTaskSchema = z.object({
  clientId: id(),
  title: line(255),
  description: text(5000).optional(),
  category: tag(50).optional(),
  duration: tag(50).optional(),
  skills: tagList(20).optional(),
  budget: money(MONEY_10_2),
  dueDate: saneDate().optional(),
  status: z.enum(["open", "in_progress", "completed"]).optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const createApplicationSchema = z.object({
  gigProfileId: id(),
  taskId: id(),
  status: z.enum(["pending", "shortlisted", "accepted", "declined"]).optional(),
});
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(["pending", "shortlisted", "accepted", "declined"]).optional(),
});
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;

export const createAssignmentSchema = z.object({
  gigProfileId: id(),
  taskId: id(),
  managerId: id(),
});
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;

export const createDeliverableSchema = z.object({
  taskId: id(),
  gigProfileId: id(),
  description: line(500),
  submissionPath: line(500),
  status: z.enum(["submitted", "approved", "revision_requested", "closed"]).optional(),
});
export type CreateDeliverableDto = z.infer<typeof createDeliverableSchema>;

export const updateDeliverableSchema = z.object({
  description: line(500).optional(),
  submissionPath: line(500).optional(),
  status: z.enum(["submitted", "approved", "revision_requested", "closed"]).optional(),
  feedback: text(500).optional(),
});
export type UpdateDeliverableDto = z.infer<typeof updateDeliverableSchema>;

export const overridePaymentSchema = z.object({
  action: z.enum(["RELEASE", "REFUND"]),
  auditReason: text(500),
});
export type OverridePaymentDto = z.infer<typeof overridePaymentSchema>;

export const createReviewSchema = z.object({
  reviewerId: id(),
  revieweeId: id(),
  taskId: id(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: text(1000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: text(1000).optional(),
});
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;

export const adminTierSchema = z.enum(["SUPER_ADMIN", "FINANCIAL_ADMIN", "SUPPORT_ADMIN", "CONTENT_MODERATOR", "AUDITOR"]);

export const createAdminInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(100),
  role: adminTierSchema.default("SUPER_ADMIN"),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).max(ADMIN_PERMISSIONS.length).optional(),
});
export type CreateAdminInvitationDto = z.infer<typeof createAdminInvitationSchema>;

export const acceptAdminInvitationSchema = z.object({
  token: z.string().min(1).max(2048),
  email: z.string().trim().email().max(100),
  password: z.string().min(1).max(200),
  // Required: the inviter saw the one-time password, so it must not stay valid.
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type AcceptAdminInvitationDto = z.infer<typeof acceptAdminInvitationSchema>;

/** Only known keys with sane ranges; unknown keys (incl. "__proto__") are rejected. */
export const updatePlatformSettingsSchema = z.object({
  commissionRakePercent: z.coerce.number().min(0).max(50),
  minimumTaskBudget: money(MONEY_10_2),
  maxEscrowThreshold: z.coerce.number().min(1).max(MONEY_10_2),
  allowedCategories: tagList(50),
  maintenanceMode: z.boolean(),
}).partial().strict();
export type UpdatePlatformSettingsDto = z.infer<typeof updatePlatformSettingsSchema>;

export const kycDecisionSchema = z.object({ status: z.enum(["VERIFIED", "REJECTED"]), reason: text(500).optional() });
export type KycDecisionDto = z.infer<typeof kycDecisionSchema>;

export const updateBadgeSchema = z.object({ badge: z.enum(["NONE", "VERIFIED_PRO", "TOP_RATED"]) });
export type UpdateBadgeDto = z.infer<typeof updateBadgeSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  // Goes to the audit trail: an account action with no stated reason can't be reviewed later.
  reason: text(500),
});
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;

export const moderateReviewSchema = z.object({
  status: z.enum(["PUBLISHED", "FLAGGED", "HIDDEN"]),
  moderatorNotes: text(500).optional(),
});
export type ModerateReviewDto = z.infer<typeof moderateReviewSchema>;

export const settleDisputeSchema = z.object({
  settlementType: z.enum(["FULL_REFUND", "FULL_RELEASE", "SPLIT"]),
  resolutionNotes: text(1000),
  splitClientPercent: z.coerce.number().int().min(1).max(99).optional(),
}).refine((v) => v.settlementType !== "SPLIT" || v.splitClientPercent !== undefined, {
  message: "A split ruling needs the client's percentage",
  path: ["splitClientPercent"],
});
export type SettleDisputeDto = z.infer<typeof settleDisputeSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;

export const twoFactorCodeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
export type TwoFactorCodeDto = z.infer<typeof twoFactorCodeSchema>;
