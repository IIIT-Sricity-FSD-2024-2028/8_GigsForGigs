/**
 * @file types/manager/index.ts
 * @description API response / request shapes for the Manager portal (mirror the backend JSON).
 */
/** Basic user info nested in API responses. */
export interface UserRef {
  userId: number;
  name: string;
  email: string;
  role: 'client' | 'gig_professional' | 'manager';
}

/** The client organisation a manager works for. */
export interface ClientRef {
  clientId: number;
  clientName: string;
  domain?: string | null;
}

/** The logged-in manager, with their user record and client. */
export interface ManagerProfile {
  managerId: number;
  userId: number;
  clientId: number;
  user: UserRef;
  client?: ClientRef;
}

/** A gig pro as nested inside task assignments. */
export interface GigProfessionalRef {
  gigProfileId: number;
  userId: number;
  bio?: string | null;
  user: {
    userId: number;
    name: string;
    email: string;
  };
  skills?: string[];
}

/** One piece of submitted work on a task. */
export interface Deliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  createdAt?: string;
  claimedDefinitions?: Array<{ definitionId: number; title: string; description: string | null }>;
  gigProfile?: {
    user: {
      name: string;
    };
  };
}

/** Links a gig pro to a task (and the supervising manager). */
export interface TaskAssignment {
  gigProfileId: number;
  taskId: number;
  managerId: number;
  assignedAt?: string;
  gigProfile?: GigProfessionalRef;
}

/** A task the manager supervises, with assignments and deliverables. */
export interface ManagerTask {
  taskId: number;
  clientId: number;
  title: string;
  description?: string | null;
  budget: number | string;
  dueDate?: string | null;
  status: 'open' | 'in_progress' | 'completed';
  progress?: number;
  client?: ClientRef;
  assignments?: TaskAssignment[];
  deliverables?: Deliverable[];
}

/** A gig pro as shown in talent search. */
export interface TalentProfile {
  gigProfileId: number;
  userId: number;
  name: string;
  bio?: string;
  price?: number;
  skills: string[];
  tools?: string[];
  portfolio?: string[];
  status: 'active' | 'busy' | 'offline';
}

/** An application against one of the manager's client's tasks (GET /managers/me/tasks/:id/applications). */
export interface ManagerApplication {
  applicationId: number;
  gigProfileId: number;
  taskId: number;
  status: 'pending' | 'shortlisted' | 'accepted' | 'declined';
  rating: number | null;
  hourlyRate: number | null;
  createdAt: string;
  gigProfile?: { user: { name: string } };
}

/** Body for shortlisting an applicant (optional rating / rate). */
export interface ShortlistApplicationDto {
  rating?: number;
  hourlyRate?: number;
}

/** Body for approving a deliverable or asking for a revision. */
export interface ReviewDeliverableDto {
  status: 'approved' | 'revision_requested';
  feedback?: string;
}

/** Body for editing the manager's own profile. */
export interface UpdateManagerProfileDto {
  name?: string;
  email?: string;
  password?: string;
}
