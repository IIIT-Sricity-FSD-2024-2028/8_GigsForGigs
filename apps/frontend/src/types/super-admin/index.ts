/**
 * @file types/super-admin/index.ts
 * @description
 * Types mirroring the REAL shapes returned by `apps/backend/src/modules/admin/*`
 * (Prisma models serialized as JSON — camelCase fields, numeric ids, decimals
 * serialized as strings). These are intentionally distinct from the older,
 * richer fixtures in `mock/adminMockData.ts` (string ids like 'cli-01', and
 * fields such as isVerified/badge/status/escrow that have no backing column
 * anywhere in `db/prisma/schema.prisma`) — do not conflate the two.
 */

export type BackendRole = 'client' | 'gig_professional' | 'manager' | 'admin';
export type TaskStatus = 'open' | 'in_progress' | 'completed';
export type ApplicationStatus = 'pending' | 'accepted' | 'declined';
export type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested' | 'closed';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface AdminUser {
  userId: number;
  name: string;
  email: string;
  role: BackendRole;
  createdAt: string;
}

export interface AdminClientRef {
  clientId: number;
  userId: number;
  clientName: string;
  numberOfManager: number;
  domain?: string | null;
}

export interface AdminClient extends AdminClientRef {
  user: AdminUser;
}

export interface AdminManager {
  clientId: number;
  managerId: number;
  userId: number;
  user: AdminUser;
  client: AdminClientRef;
}

export interface AdminGigProfileRef {
  gigProfileId: number;
  userId: number;
  bio?: string | null;
}

export interface AdminGigProfile extends AdminGigProfileRef {
  user: AdminUser;
}

export interface AdminTaskRef {
  taskId: number;
  clientId: number;
  title: string;
  description?: string | null;
  budget: string;
  dueDate?: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTask extends AdminTaskRef {
  client: AdminClientRef;
}

export interface AdminApplication {
  applicationId: number;
  gigProfileId: number;
  taskId: number;
  status: ApplicationStatus;
  createdAt: string;
  task: AdminTaskRef;
  gigProfile: AdminGigProfileRef;
}

export interface AdminAssignment {
  gigProfileId: number;
  taskId: number;
  managerId: number;
  assignedAt: string;
  task: AdminTaskRef;
  gigProfile: AdminGigProfileRef;
  manager: { clientId: number; managerId: number; userId: number };
}

export interface AdminDeliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  feedback?: string | null;
  status: DeliverableStatus;
  createdAt: string;
  task: AdminTaskRef;
  gigProfile: AdminGigProfileRef;
}

export interface AdminPayment {
  paymentId: number;
  taskId: number;
  gigProfileId: number;
  amount: string;
  status: PaymentStatus;
  createdAt: string;
  task: AdminTaskRef;
  gigProfile: AdminGigProfileRef;
}

export interface AdminReview {
  reviewId: number;
  reviewerId: number;
  revieweeId: number;
  taskId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer: AdminUser;
  reviewee: AdminUser;
  task: AdminTaskRef;
}

/** Only the figures the real schema supports — see admin.service.ts's
 * getDashboardStats(). No escrow/disputes/moderation/audit-log backing exists. */
export interface AdminDashboardStats {
  totalUsers: number;
  totalClients: number;
  totalGigPros: number;
  totalManagers: number;
  activeTasks: number;
  totalApplications: number;
  grossMerchandiseVolume: number;
  avgPlatformRating: number;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: BackendRole;
}
export type UpdateUserDto = Partial<CreateUserDto>;

export interface UpdateClientDto {
  clientName?: string;
  domain?: string;
}

export interface UpdateTaskDto {
  clientId?: number;
  title?: string;
  description?: string;
  budget?: number;
  dueDate?: string;
  status?: TaskStatus;
}

export interface UpdatePaymentDto {
  amount?: number;
  status?: PaymentStatus;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}
