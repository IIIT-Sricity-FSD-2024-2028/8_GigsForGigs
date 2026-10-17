/**
 * @file index.ts
 * @description
 * TypeScript interfaces and type definitions for the Gig Professional portal module.
 * These mirror the backend's native Prisma-shaped JSON responses (camelCase keys,
 * numeric ids, lowercase enum values) exactly — the backend does no dialect
 * translation, so these types are the wire contract as-is.
 */

/**
 * Client summary nested on a task response.
 */
export interface TaskClient {
  clientId: number;
  clientName: string;
  domain?: string | null;
}

/**
 * Single deliverable submission belonging to a gig task.
 */
export interface GigDeliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  feedback?: string | null;
  createdAt?: string;
  claimedDefinitions?: Array<{ definitionId: number; title: string; description: string | null }>;
}

/**
 * A deliverable the client expects on a task, plus the submissions made against it.
 */
export interface TaskDeliverableDefinition {
  definitionId: number;
  taskId: number;
  title: string;
  description: string | null;
  createdAt: string;
  submissions: Array<{
    deliverableNo: number;
    description?: string;
    submissionPath?: string;
    status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
    createdAt: string;
    feedback: string | null;
  }>;
}

/**
 * Task item structure as viewed by the Gig Professional.
 */
export interface GigTask {
  taskId: number;
  clientId: number;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'in_progress' | 'completed';
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  client?: TaskClient;
  deliverables?: GigDeliverable[];
}

/**
 * Client request or invitation sent to a Gig Professional.
 */
export interface PendingRequest {
  applicationId: number;
  taskId: number;
  gigProfileId: number;
  status: 'pending' | 'accepted' | 'declined' | 'shortlisted';
  createdAt?: string;
  task?: GigTask;
}

/**
 * Review entity attached to a completed task.
 */
export interface GigReview {
  reviewId: number;
  taskId?: number;
  reviewerId: number;
  revieweeId: number;
  reviewerName?: string;
  revieweeName?: string;
  clientName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

/**
 * Payout or transaction record for completed gig tasks.
 */
export interface PaymentTransaction {
  paymentId: number;
  taskId: number;
  gigProfileId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt?: string;
  task?: {
    taskId: number;
    title: string;
    client?: { clientId: number; clientName: string };
  };
}

/**
 * Completed project entity with associated client reviews and payment details.
 */
export interface CompletedProject {
  taskId: number;
  clientId: number;
  title: string;
  description: string;
  budget: number;
  status: 'completed';
  completedAt?: string;
  client?: TaskClient;
  reviews?: GigReview[];
  payment?: PaymentTransaction;
}

/**
 * Summary breakdown of total earnings, payments history, and completed task counts.
 */
export interface EarningsSummary {
  totalEarnings: number;
  completedTasks: number;
  payments: PaymentTransaction[];
}

/**
 * Service listing offered by the Gig Professional.
 */
export interface GigService {
  serviceId: number;
  gigProfileId: number;
  title: string;
  description: string;
  price: number;
  tags: string[];
  thumbnail?: string;
  createdAt?: string;
}

/**
 * Comprehensive profile model for the Gig Professional.
 */
export interface GigProfile {
  gigProfileId: number;
  userId: number;
  name: string;
  email: string;
  bio?: string;
  skills: string[];
  portfolio: string[];
  tools?: string[];
}

/**
 * Payload for posting a new service offering.
 */
export interface CreateServiceDto {
  title: string;
  description: string;
  price: number;
  tags: string[];
  thumbnail?: string;
}

/**
 * Payload for submitting a new task deliverable.
 */
export interface SubmitDeliverableDto {
  taskId: number;
  content: string;
  notes?: string;
  definitionIds?: number[];
}

/**
 * Payload for responding to an incoming task request.
 */
export interface RespondRequestDto {
  action: 'accepted' | 'declined';
}
