/**
 * @file types.ts
 * @description Redux state shape for Super Admin, importing canonical domain contracts from adminTypes.
 */

import type {
  AdminAnalyticsData,
  AdminInviteResult,
  AdminKPIs,
  AdminStaff,
  AdminUserProfile,
  AdminUserSummary,
  AuditLogEntry,
  CategoryDemand,
  ClientDetail,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  VelocityPoint,
} from '../../services/api/admin/adminTypes';

export type {
  AdminAnalyticsData,
  AdminInviteResult,
  AdminKPIs,
  AdminStaff,
  AdminUserProfile,
  AdminUserSummary,
  AuditLogEntry,
  CategoryDemand,
  ClientDetail,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  VelocityPoint,
};

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface RequestState {
  status: RequestStatus;
  error: string | null;
  requestId?: string;
}

export interface AdminState {
  kpis: AdminKPIs | null;
  kpisRequest: RequestState;

  analytics: Record<string, AdminAnalyticsData>;
  analyticsRequest: RequestState;

  users: AdminUserSummary[];
  usersRequest: RequestState;

  clients: ClientDetail[];
  clientsRequest: RequestState;

  gigPros: GigProDetail[];
  gigProsRequest: RequestState;

  managers: ManagerDetail[];
  managersRequest: RequestState;

  projects: ProjectTask[];
  projectsRequest: RequestState;

  reviews: ModerationReview[];
  reviewsRequest: RequestState;

  disputes: DisputeCase[];
  disputesRequest: RequestState;

  adminStaff: AdminStaff[];
  adminStaffRequest: RequestState;
  latestCreatedInvite: AdminInviteResult | null;

  auditLogs: AuditLogEntry[];
  auditLogsRequest: RequestState;

  platformSettings: PlatformSettingsData | null;
  platformSettingsRequest: RequestState;
  platformSettingsSave: RequestState;

  profile: AdminUserProfile | null;
  profileRequest: RequestState;
  twoFactorEnrollment: { secret: string; otpauthUri: string } | null;
  mutationErrors: Record<string, string | null>;
}
