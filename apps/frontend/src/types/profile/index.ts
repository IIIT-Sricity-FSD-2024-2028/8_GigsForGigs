/**
 * @file index.ts
 * @description
 * Wire types for the counterparty profiles: the applicant profile a client
 * sees (GET /applications/:id/profile) and the client profile a gig
 * professional sees (GET /gig/tasks/:taskId/client-profile). Mirrors
 * apps/backend/src/modules/profile/profile.service.ts.
 */

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'declined';

/** A published review someone received. */
export interface PublicReview {
  reviewId: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  taskTitle: string;
  createdAt: string;
}

/** Average of published reviews; `average` is null until there is at least one. */
export interface ProfileRating {
  average: number | null;
  count: number;
}

/** The application that links the viewer to the profile. */
export interface ApplicationContext {
  applicationId: number;
  taskId: number;
  taskTitle: string;
  status: ApplicationStatus;
  appliedAt: string;
}

/** A gig professional's profile as a client sees it. */
export interface PublicGigProfile {
  gigProfileId: number;
  name: string;
  email: string;
  bio: string | null;
  /** VERIFIED_PRO | TOP_RATED, awarded by admins; null when none. */
  badge: string | null;
  memberSince: string;
  skills: string[];
  tools: string[];
  portfolio: string[];
  services: Array<{ serviceId: number; title: string; price: number; category: string | null }>;
  stats: { completedProjects: number };
  rating: ProfileRating;
  recentReviews: PublicReview[];
}

/** A client's profile as a gig professional sees it. */
export interface PublicClientProfile {
  clientId: number;
  organizationName: string;
  domain: string | null;
  contactName: string;
  /** Only shared once this client has hired the viewer; null before that. */
  contactEmail: string | null;
  isVerified: boolean;
  memberSince: string;
  stats: { tasksPosted: number; openTasks: number; professionalsHired: number };
  rating: ProfileRating;
  recentReviews: PublicReview[];
}

export interface ApplicantProfileResponse {
  application: ApplicationContext;
  profile: PublicGigProfile;
}

export interface TaskClientProfileResponse {
  task: { taskId: number; title: string };
  /** null for a hire that has no application record. */
  application: ApplicationContext | null;
  hiredOnTask: boolean;
  profile: PublicClientProfile;
}
