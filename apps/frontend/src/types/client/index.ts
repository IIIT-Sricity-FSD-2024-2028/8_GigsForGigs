/**
 * @file types/client/index.ts
 * @description
 * Strongly typed request and response contracts for the Client domain.
 * Mirrors the Express + Prisma backend JSON data structures.
 */

import type { ApplicantProfileResponse } from '../profile';
import type { HireWorkStatus } from '../../utils/taskStatus';

// Re-export profile response for convenience
export type { ApplicantProfileResponse };

/** Basic user reference nested in client responses. */
export interface UserRef {
  userId: number;
  name: string;
  email: string;
  role: string;
}

/** The client organisation profile as returned by GET /clients/me. */
export interface ClientProfileData {
  clientId: number;
  userId: number;
  clientName: string;
  numberOfManager: number;
  domain?: string | null;
  user?: UserRef;
}

/** DTO for updating client profile. */
export interface UpdateClientProfileDto {
  clientName?: string;
  domain?: string;
}

/** DTO for creating a task (job posting). */
export interface TaskDto {
  title: string;
  description?: string;
  category?: string;
  duration?: string;
  skills?: string[];
  budget: number;
  dueDate?: string;
}

export type CreateTaskDto = TaskDto;
export type UpdateTaskDto = Partial<TaskDto>;

/** Raw task model returned by GET /tasks, POST /tasks, PATCH /tasks/:id. */
export interface RawTask {
  taskId: number;
  clientId: number;
  title: string;
  description: string | null;
  budget: number | string;
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  category: string | null;
  duration: string | null;
  skills: string[];
}

/** Raw application from a gig professional to a client's task. */
export interface RawApplication {
  applicationId: number;
  gigProfileId: number;
  taskId: number;
  status: 'pending' | 'accepted' | 'declined' | 'shortlisted' | 'withdrawn' | 'removed';
  createdAt: string;
  hourlyRate: number | string | null;
  rating: number | null;
  reviewRating?: {
    average: number | null;
    count: number;
  };
  task?: {
    taskId: number;
    title: string;
    budget: number | string;
    status: string;
    createdAt: string;
    skills?: string[];
  };
  gigProfile?: {
    gigProfileId: number;
    userId: number;
    bio: string | null;
    user: {
      userId: number;
      name: string;
      email: string;
    };
  };
}

/** DTO for reviewing (accepting/declining) an application. */
export interface ReviewApplicationDto {
  status: 'accepted' | 'declined';
}

/** A review left on a contract. */
export interface RawContractReview {
  reviewId: number;
  taskId: number;
  reviewerId: number;
  revieweeId: number;
  reviewerName?: string;
  revieweeName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** Payment status enum matching backend PAYMENT.status. */
export type RawPaymentStatus = 'pending' | 'held' | 'completed' | 'refunded' | 'failed';

/** Derived contract returned by GET /contracts. */
export interface RawContract {
  taskId: number;
  taskTitle: string;
  gigProfileId: number;
  gigProfessionalName: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  budget: number | string;
  paymentId: number | null;
  platformFee: number;
  totalAmount: number;
  paymentStatus: RawPaymentStatus | null;
  managerId: number | null;
  submissionCount: number;
  workStatus?: HireWorkStatus;
  hasOpenDispute: boolean;
  createdAt: string;
  reviews?: RawContractReview[];
}

/** Expected deliverable definition on a task. */
export interface TaskDeliverableDefinition {
  definitionId: number;
  taskId: number;
  title: string;
  description: string | null;
  createdAt: string;
  submissions: Array<{
    deliverableNo: number;
    status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
    createdAt: string;
    feedback: string | null;
  }>;
}

/** DTO for creating a deliverable definition. */
export interface CreateDeliverableDefinitionDto {
  title: string;
  description?: string;
}

/** DTO for updating a deliverable definition. */
export interface UpdateDeliverableDefinitionDto {
  title?: string;
  description?: string;
}

/** One submission of work by a gig professional. */
export interface RawDeliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  createdAt: string;
  feedback: string | null;
  gigProfile?: {
    user: {
      name: string;
    };
  };
  claimedDefinitions?: Array<{ definitionId: number; title: string; description: string | null }>;
}

/** DTO for reviewing a submitted deliverable. */
export interface ReviewDeliverableDto {
  status: 'approved' | 'revision_requested';
  feedback?: string;
}

/** Service listing offered by a gig professional. */
export interface RawService {
  serviceId: number;
  gigProfileId: number;
  title: string;
  description: string | null;
  price: number | string;
  thumbnail?: string | null;
  category?: string | null;
  rating?: number | null;
  status: string;
  createdAt: string;
  tags: Array<{ tag: string }>;
  profile?: {
    gigProfileId?: number;
    user: {
      userId: number;
      name: string;
      email: string;
    };
  };
}

/** Service hire request record. */
export interface RawServiceRequest {
  requestId: number;
  serviceId: number;
  clientId: number;
  status: string;
  createdAt: string;
  service?: RawService;
}

/** Response when requesting a service hire. */
export interface RequestServiceResponse {
  task: RawTask;
  application: RawApplication;
}

/** Active manager on the client's roster. */
export interface RawManager {
  clientId: number;
  managerId: number;
  userId: number;
  createdAt: string;
  user: {
    userId?: number;
    name: string;
    email: string;
  };
  client?: {
    clientId?: number;
    clientName: string;
  };
}

/** DTO for editing manager name/email. */
export interface UpdateManagerDto {
  name?: string;
  email?: string;
}

/** Invitation sent to a manager. */
export interface RawManagerInvite {
  inviteId: number;
  clientId: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedUserId: number | null;
  createdAt: string;
  inviteLink?: string;
}

/** DTO for creating a manager invite. */
export interface CreateManagerInviteDto {
  name: string;
  email: string;
}

/** DTO for assigning a manager to a funded hire. */
export interface SetTaskManagerDto {
  gigProfileId: number;
  managerId: number | null;
}

/** Response for assigning a manager. */
export interface SetTaskManagerResponse {
  taskId: number;
  gigProfileId: number;
  managerId: number | null;
}

/** DTO for raising an escrow dispute. */
export interface CreateDisputeDto {
  gigProfileId: number;
  reason: string;
  description: string;
}

/** Response for dispute creation. */
export interface CreateDisputeResponse {
  disputeId: number;
  status: string;
}

/** DTO for submitting a review for a completed task hire. */
export interface CreateClientReviewDto {
  taskId: number;
  gigProfileId: number;
  rating: number;
  comment?: string;
}

/** Review entity as stored in the database and returned on creation. */
export interface ReviewRecord {
  reviewId: number;
  taskId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

// ===========================================================================
// CLIENT DOMAIN / UI VIEW MODELS
// ===========================================================================

export type PaymentStatus = RawPaymentStatus;
export type ContractReview = RawContractReview;

/** A task (job) the client has posted. */
export interface Task {
  task_id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  dueDate?: string | null;
  skills?: string[];
  category?: string;
  duration?: string;
}

/** A manager row: either a pending invite or an active manager. */
export interface ManagerInvite {
  invite_id: string;
  client_id: string;
  name: string;
  email: string;
  clientName?: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  invite_link?: string;
  kind: 'invite' | 'manager';
}

/** A service a gig pro offers on the marketplace. */
export interface Service {
  service_id: string;
  title: string;
  price: number;
  description: string;
  skills: string[];
  category?: string;
  rating?: number;
  user?: { name: string; email: string };
  gig_profile_id: string;
}

/** One hired gig pro on a task with progress and payment info. */
export interface Contract {
  contract_id: string;
  task_id: string;
  gig_profile_id: string;
  task_title: string;
  gig_pro_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED';
  progress: number;
  budget: number;
  payment_id: number | null;
  platform_fee: number;
  total_amount: number;
  payment_status: PaymentStatus | null;
  manager_id?: number | null;
  submission_count: number;
  work_status?: HireWorkStatus;
  has_open_dispute: boolean;
  createdAt: string;
  reviews?: ContractReview[];
}

/** One piece of work a gig pro submitted on a task. */
export interface Deliverable {
  task_id: string;
  deliverable_no: number;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'CLOSED';
  createdAt: string;
  feedback?: string | null;
}

/** A gig pro's application to one of the client's tasks. */
export interface Application {
  application_id: string;
  task_id: string;
  task_title: string;
  gig_profile_id: string;
  candidate_name: string;
  candidate_role: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  rating?: number;
  review_average: number | null;
  review_count: number;
  hourlyRate?: number;
  rate: number;
  createdAt: string;
  is_service_request: boolean;
}

