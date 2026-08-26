/**
 * @file index.ts
 * @description
 * TypeScript interfaces and type definitions for the Gig Professional portal module.
 * Provides explicit typings for tasks, deliverables, requests, earnings, services,
 * and user profile DTOs to enforce strict type safety across all components and API layers.
 */

/**
 * Single deliverable submission belonging to a gig task.
 */
export interface GigDeliverable {
  deliverable_id?: string;
  deliverable_no: number;
  task_id: string;
  gig_profile_id?: string;
  content: string;
  notes?: string;
  createdAt?: string;
}

/**
 * Task item structure as viewed by the Gig Professional.
 */
export interface GigTask {
  task_id: string;
  title: string;
  description: string;
  client_id: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
  deliverables?: GigDeliverable[];
}

/**
 * Client request or invitation sent to a Gig Professional.
 */
export interface PendingRequest {
  application_id: string;
  task_id: string;
  gig_profile_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  budget?: number;
  createdAt?: string;
  task?: {
    task_id: string;
    title: string;
    description: string;
    client_id: string;
    budget: number;
    createdAt?: string;
  };
}

/**
 * Review entity attached to a completed task.
 */
export interface GigReview {
  review_id: string;
  rating: number;
  comment?: string;
  client_name?: string;
  createdAt?: string;
}

/**
 * Payout or transaction record for completed gig tasks.
 */
export interface PaymentTransaction {
  payment_id?: string;
  task_id: string;
  gig_profile_id: string;
  amount: number;
  paidAt: string;
  createdAt?: string;
}

/**
 * Completed project entity with associated client reviews and payment details.
 */
export interface CompletedProject {
  task_id: string;
  title: string;
  description: string;
  client_id: string;
  budget: number;
  status: 'COMPLETED';
  completedAt?: string;
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
  service_id: string;
  gig_profile_id: string;
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
  gig_profile_id: string;
  user_id: string;
  name: string;
  email: string;
  bio?: string;
  skills: string[];
  portfolio: string[];
  tools?: string[];
  rating?: number;
  jobSuccessRate?: number;
  completedProjectsCount?: number;
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
  taskId: string;
  content: string;
  notes?: string;
}

/**
 * Payload for responding to an incoming task request.
 */
export interface RespondRequestDto {
  action: 'accepted' | 'declined';
}
