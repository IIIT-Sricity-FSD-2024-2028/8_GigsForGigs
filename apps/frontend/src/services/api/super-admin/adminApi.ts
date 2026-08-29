/**
 * @file adminApi.ts
 * @description
 * Real calls against the backend's /api/admin/* routes (see
 * `apps/backend/src/modules/admin/{admin.route,admin.controller,admin.service}.ts`).
 *
 * Unlike managerApi.ts/gigApi.ts, this file does NOT fall back to an in-file
 * mock dataset on failure: admin CRUD failing silently into fake data would
 * make an admin believe a delete/edit succeeded when it didn't. Callers are
 * expected to catch ApiError and render a loading/error state instead (see
 * the `authError` pattern in pages/auth/Login/Login.tsx).
 *
 * Every route here requires `roleGuard('admin')` on the backend, so every
 * call is made with `actor: 'admin'`.
 */
import { apiFetch } from '../httpClient';
import type {
  AdminApplication,
  AdminAssignment,
  AdminClient,
  AdminDashboardStats,
  AdminDeliverable,
  AdminGigProfile,
  AdminManager,
  AdminPayment,
  AdminReview,
  AdminTask,
  AdminUser,
  CreateUserDto,
  UpdateClientDto,
  UpdatePaymentDto,
  UpdateReviewDto,
  UpdateTaskDto,
  UpdateUserDto,
} from '../../../types/super-admin';

const actor = 'admin' as const;

export const adminApi = {
  // ---- Dashboard ----------------------------------------------------------
  getDashboardStats: () => apiFetch<AdminDashboardStats>('/admin/dashboard/stats', { actor }),

  // ---- Users --------------------------------------------------------------
  listUsers: () => apiFetch<AdminUser[]>('/admin/users', { actor }),
  getUser: (userId: number) => apiFetch<AdminUser>(`/admin/users/${userId}`, { actor }),
  createUser: (dto: CreateUserDto) =>
    apiFetch<AdminUser>('/admin/users', { method: 'POST', body: dto, actor }),
  updateUser: (userId: number, dto: UpdateUserDto) =>
    apiFetch<AdminUser>(`/admin/users/${userId}`, { method: 'PATCH', body: dto, actor }),
  deleteUser: (userId: number) =>
    apiFetch<void>(`/admin/users/${userId}`, { method: 'DELETE', actor }),

  // ---- Clients --------------------------------------------------------------
  listClients: () => apiFetch<AdminClient[]>('/admin/clients', { actor }),
  getClient: (clientId: number) => apiFetch<AdminClient>(`/admin/clients/${clientId}`, { actor }),
  updateClient: (clientId: number, dto: UpdateClientDto) =>
    apiFetch<AdminClient>(`/admin/clients/${clientId}`, { method: 'PATCH', body: dto, actor }),
  deleteClient: (clientId: number) =>
    apiFetch<void>(`/admin/clients/${clientId}`, { method: 'DELETE', actor }),

  // ---- Managers -------------------------------------------------------------
  listManagers: () => apiFetch<AdminManager[]>('/admin/managers', { actor }),
  createManager: (dto: { userId: number; clientId: number }) =>
    apiFetch<AdminManager>('/admin/managers', { method: 'POST', body: dto, actor }),
  deleteManager: (clientId: number, managerId: number) =>
    apiFetch<void>(`/admin/managers/${clientId}/${managerId}`, { method: 'DELETE', actor }),

  // ---- Gig profiles -----------------------------------------------------------
  listGigProfiles: () => apiFetch<AdminGigProfile[]>('/admin/gig-profiles', { actor }),
  getGigProfile: (gigProfileId: number) =>
    apiFetch<AdminGigProfile>(`/admin/gig-profiles/${gigProfileId}`, { actor }),
  updateGigProfile: (gigProfileId: number, dto: { bio?: string }) =>
    apiFetch<AdminGigProfile>(`/admin/gig-profiles/${gigProfileId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    }),
  deleteGigProfile: (gigProfileId: number) =>
    apiFetch<void>(`/admin/gig-profiles/${gigProfileId}`, { method: 'DELETE', actor }),

  // ---- Tasks ------------------------------------------------------------------
  listTasks: () => apiFetch<AdminTask[]>('/admin/tasks', { actor }),
  getTask: (taskId: number) => apiFetch<AdminTask>(`/admin/tasks/${taskId}`, { actor }),
  updateTask: (taskId: number, dto: UpdateTaskDto) =>
    apiFetch<AdminTask>(`/admin/tasks/${taskId}`, { method: 'PATCH', body: dto, actor }),
  deleteTask: (taskId: number) => apiFetch<void>(`/admin/tasks/${taskId}`, { method: 'DELETE', actor }),

  // ---- Applications -------------------------------------------------------------
  listApplications: () => apiFetch<AdminApplication[]>('/admin/applications', { actor }),
  updateApplication: (applicationId: number, dto: { status: 'pending' | 'accepted' | 'declined' }) =>
    apiFetch<AdminApplication>(`/admin/applications/${applicationId}`, {
      method: 'PATCH',
      body: dto,
      actor,
    }),
  deleteApplication: (applicationId: number) =>
    apiFetch<void>(`/admin/applications/${applicationId}`, { method: 'DELETE', actor }),

  // ---- Assignments -------------------------------------------------------------
  listAssignments: () => apiFetch<AdminAssignment[]>('/admin/assignments', { actor }),
  createAssignment: (dto: { gigProfileId: number; taskId: number; managerId: number }) =>
    apiFetch<AdminAssignment>('/admin/assignments', { method: 'POST', body: dto, actor }),
  deleteAssignment: (gigProfileId: number, taskId: number) =>
    apiFetch<void>(`/admin/assignments/${gigProfileId}/${taskId}`, { method: 'DELETE', actor }),

  // ---- Deliverables -------------------------------------------------------------
  listDeliverables: () => apiFetch<AdminDeliverable[]>('/admin/deliverables', { actor }),
  updateDeliverable: (
    taskId: number,
    deliverableNo: number,
    dto: { description?: string; submissionPath?: string; status?: string; feedback?: string },
  ) =>
    apiFetch<AdminDeliverable>(`/admin/deliverables/${taskId}/${deliverableNo}`, {
      method: 'PATCH',
      body: dto,
      actor,
    }),
  deleteDeliverable: (taskId: number, deliverableNo: number) =>
    apiFetch<void>(`/admin/deliverables/${taskId}/${deliverableNo}`, { method: 'DELETE', actor }),

  // ---- Payments -------------------------------------------------------------------
  listPayments: () => apiFetch<AdminPayment[]>('/admin/payments', { actor }),
  updatePayment: (paymentId: number, dto: UpdatePaymentDto) =>
    apiFetch<AdminPayment>(`/admin/payments/${paymentId}`, { method: 'PATCH', body: dto, actor }),
  deletePayment: (paymentId: number) =>
    apiFetch<void>(`/admin/payments/${paymentId}`, { method: 'DELETE', actor }),

  // ---- Reviews -----------------------------------------------------------------
  listReviews: () => apiFetch<AdminReview[]>('/admin/reviews', { actor }),
  updateReview: (reviewId: number, dto: UpdateReviewDto) =>
    apiFetch<AdminReview>(`/admin/reviews/${reviewId}`, { method: 'PATCH', body: dto, actor }),
  deleteReview: (reviewId: number) =>
    apiFetch<void>(`/admin/reviews/${reviewId}`, { method: 'DELETE', actor }),
};

export default adminApi;
