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
  ClientDossier,
  CreateClientAccountInput,
  CreateManagerSeatInput,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  GigProDossier,
  ManagerAssignmentRow,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  UpdateClientDetailsInput,
  UpdateGigProDetailsInput,
  UpdateManagerDetailsInput,
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
  ClientDossier,
  CreateClientAccountInput,
  CreateManagerSeatInput,
  DisputeCase,
  DisputeSettlementOutcome,
  GigProDetail,
  GigProDossier,
  ManagerAssignmentRow,
  ManagerDetail,
  ModerationReview,
  PlatformSettingsData,
  ProjectTask,
  UpdateClientDetailsInput,
  UpdateGigProDetailsInput,
  UpdateManagerDetailsInput,
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
  clientDossiers: Record<string, ClientDossier>;
  clientDossierRequest: RequestState;

  gigPros: GigProDetail[];
  gigProsRequest: RequestState;
  gigProDossiers: Record<string, GigProDossier>;
  gigProDossierRequest: RequestState;

  managers: ManagerDetail[];
  managersRequest: RequestState;
  assignments: ManagerAssignmentRow[];
  assignmentsRequest: RequestState;

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
