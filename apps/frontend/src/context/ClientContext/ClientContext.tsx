import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { apiFetch, ApiError } from '../../services/api/httpClient';

/**
 * @file ClientContext.tsx
 * @description
 * Real backend-backed client context. Every method below hits the actual
 * Express + Prisma routes under `modules/client` and `modules/manager` (see
 * `apps/backend/src/modules/client/client.route.ts` and
 * `apps/backend/src/modules/manager/manager.route.ts`) via `apiFetch`.
 * This file previously held an in-memory mock (`useState` seeded with fake
 * rows) — that has been fully removed in favor of real fetch/mutate calls,
 * with `loading`/`error` state and response-shape mapping to keep the
 * existing page components working with minimal changes.
 *
 * KNOWN GAPS vs. the real backend (see final task report for the full
 * writeup — kept brief here as inline comments at each affected mapping):
 *  - Invited managers activate via the one-time link
 *    (ManagerInviteSetup -> POST /api/auth/manager/accept-invite).
 *  - APPLICATION has no dedicated "candidate role"/reviewing-manager
 *    columns; ReviewShortlist approximates "role" from GigProfile.bio.
 */

/** A task (job) the client has posted. */
export interface Task {
  task_id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  dueDate?: string | null;
  skills?: string[];
  category?: string;
  duration?: string;
}

/** A manager row: either a pending invite or an active manager (see `kind`). */
export interface ManagerInvite {
  invite_id: string;
  client_id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  /** One-time activation link for a pending invite (shared by the client; nothing is emailed). */
  invite_link?: string;
  /**
   * 'invite' = a MANAGER_INVITE row (from GET /manager-invites) that has not
   * (and, given the current backend, never will) become a real MANAGER row.
   * 'manager' = an actual MANAGER row (from GET /managers) that supports
   * PATCH/DELETE via /managers/:managerId. Only 'manager' rows can be
   * edited/deleted for real.
   */
  kind: 'invite' | 'manager';
}

/** A service a gig pro offers on the marketplace. */
export interface Service {
  service_id: string;
  title: string;
  price: number;
  description: string;
  skills: string[];
  user?: { name: string; email: string };
  gig_profile_id: string;
}

/** A review left on a finished contract (by client or gig pro). */
export interface ContractReview {
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

/** A task that has a hired gig pro, with progress and payment info. */
export interface Contract {
  contract_id: string;
  task_id: string;
  task_title: string;
  gig_pro_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'REVIEWING';
  progress: number;
  budget: number;
  payment_id: number | null;
  platform_fee: number;
  total_amount: number;
  payment_status: PaymentStatus | null;
  /** MANAGER.manager_id supervising this task; null = the client supervises it. */
  manager_id?: number | null;
  createdAt: string;
  reviews?: ContractReview[];
}

/** Mirrors the PAYMENT.status enum: pending = awaiting client funding, held = in escrow. */
export type PaymentStatus = 'pending' | 'held' | 'completed' | 'refunded' | 'failed';

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
  hourlyRate?: number;
  rate: number;
  createdAt: string;
  /** Service-hire request sent to a professional; they accept/decline it, not the client. */
  is_service_request: boolean;
}

/** Everything exposed by useClient(): the data lists plus the actions that change them. */
interface ClientContextType {
  tasks: Task[];
  managers: ManagerInvite[];
  services: Service[];
  contracts: Contract[];
  deliverables: Deliverable[];
  applications: Application[];
  loading: boolean;
  error: string | null;
  addTask: (title: string, description: string, budget: number, category?: string, duration?: string, skills?: string) => Promise<void>;
  updateTask: (taskId: string, title: string, description: string, budget: number, category?: string, duration?: string, skills?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  inviteManager: (name: string, email: string) => Promise<string | undefined>;
  revokeManagerInvite: (inviteId: string) => Promise<void>;
  updateManager: (inviteId: string, name: string, email: string) => Promise<void>;
  deleteManager: (inviteId: string) => Promise<void>;
  fetchTaskDeliverables: (taskId: string) => Promise<void>;
  approveDeliverable: (taskId: string, deliverableNo: number) => Promise<void>;
  rejectDeliverable: (taskId: string, deliverableNo: number, feedback?: string) => Promise<void>;
  hireCandidate: (applicationId: string) => Promise<void>;
  payTask: (taskId: string) => Promise<void>;
  releasePayment: (taskId: string) => Promise<void>;
  /** Pick the manager for a funded task; null keeps it with the client. */
  assignTaskManager: (taskId: string, managerId: number | null) => Promise<void>;
  rejectCandidate: (applicationId: string) => Promise<void>;
  requestService: (serviceId: string) => Promise<void>;
  requestedServices: Set<string>;
  refreshContracts: () => Promise<void>;
  submitReview: (taskId: number, rating: number, comment?: string) => Promise<void>;
}

const ClientContextInstance = createContext<ClientContextType | undefined>(undefined);

// ---- Raw API response shapes (client.service.ts / manager.service.ts) -----

interface RawUser {
  userId: number;
  name: string;
  email: string;
  role?: string;
}

interface RawGigProfile {
  gigProfileId: number;
  userId: number;
  bio: string | null;
  user: RawUser;
}

type RawTaskStatus = 'open' | 'in_progress' | 'completed';

interface RawTask {
  taskId: number;
  clientId: number;
  title: string;
  description: string | null;
  category: string | null;
  duration: string | null;
  skills: string[];
  budget: string;
  dueDate: string | null;
  status: RawTaskStatus;
  createdAt: string;
  updatedAt: string;
}

interface RawApplication {
  applicationId: number;
  gigProfileId: number;
  taskId: number;
  status: 'pending' | 'shortlisted' | 'accepted' | 'declined';
  rating: number | null;
  hourlyRate: string | null;
  createdAt: string;
  task?: RawTask;
  gigProfile?: RawGigProfile;
}

interface RawContract {
  taskId: number;
  taskTitle: string;
  gigProfessionalName: string;
  status: RawTaskStatus;
  progress: number;
  budget: string | number;
  paymentId: number | null;
  platformFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus | null;
  managerId?: number | null;
  createdAt: string;
  reviews?: ContractReview[];
}

interface RawDeliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  feedback?: string | null;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  createdAt: string;
}

interface RawServiceTag {
  tag: string;
}

interface RawService {
  serviceId: number;
  gigProfileId: number;
  title: string;
  description: string | null;
  price: string;
  thumbnail?: string | null;
  status: string;
  createdAt: string;
  tags?: RawServiceTag[];
  profile?: { user: RawUser };
}

interface RawServiceRequest {
  requestId: number;
  serviceId: number;
  clientId: number;
  status: string;
  createdAt: string;
  service?: RawService;
}

interface RawManagerInvite {
  inviteId: number;
  clientId: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedUserId: number | null;
  createdAt: string;
  inviteLink?: string;
}

interface RawManager {
  managerId: number;
  clientId: number;
  userId: number;
  user: RawUser;
}

// ---- Mapping helpers (raw API shape -> internal UI shape) -----------------
// The API uses camelCase + numeric ids + lowercase statuses; the client pages
// were written against snake_case + string ids + UPPERCASE statuses.

/** Turn a UI id string (e.g. "12" or "TASK-12") into the number the API expects. */
function toNumericId(id: string): number {
  return Number(id.replace(/[^0-9]/g, '')) || Number(id);
}

/** Split "React, Node , " into ['React', 'Node']; undefined stays undefined. */
function parseSkills(skills?: string): string[] | undefined {
  return skills === undefined
    ? undefined
    : skills.split(',').map((s) => s.trim()).filter(Boolean);
}

/** API task status -> UI task status. */
function mapTaskStatus(status: RawTaskStatus): Task['status'] {
  switch (status) {
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    default:
      return 'OPEN';
  }
}

/** API task -> UI Task. */
function mapTask(raw: RawTask): Task {
  return {
    task_id: String(raw.taskId),
    title: raw.title,
    description: raw.description ?? '',
    budget: Number(raw.budget),
    status: mapTaskStatus(raw.status),
    createdAt: raw.createdAt,
    dueDate: raw.dueDate,
    category: raw.category ?? undefined,
    duration: raw.duration ?? undefined,
    skills: raw.skills,
  };
}

/** API status -> contract status (an "open" task with a hire is shown as SCHEDULED). */
function mapContractStatus(status: RawTaskStatus): Contract['status'] {
  switch (status) {
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    default:
      return 'SCHEDULED';
  }
}

/** API contract -> UI Contract (money fields arrive as strings and are converted to numbers). */
function mapContract(raw: RawContract): Contract {
  return {
    // CONTRACT has no surrogate id server-side — contracts are derived from
    // accepted applications, keyed by taskId.
    contract_id: String(raw.taskId),
    task_id: String(raw.taskId),
    task_title: raw.taskTitle,
    gig_pro_name: raw.gigProfessionalName,
    status: mapContractStatus(raw.status),
    progress: raw.progress,
    budget: Number(raw.budget),
    payment_id: raw.paymentId,
    platform_fee: Number(raw.platformFee),
    total_amount: Number(raw.totalAmount),
    payment_status: raw.paymentStatus,
    manager_id: raw.managerId ?? null,
    createdAt: raw.createdAt,
    reviews: raw.reviews ?? [],
  };
}

/** API deliverable status -> UI status ('submitted' becomes PENDING). */
function mapDeliverableStatus(status: RawDeliverable['status']): Deliverable['status'] {
  switch (status) {
    case 'approved':
      return 'APPROVED';
    case 'revision_requested':
      return 'REVISION_REQUESTED';
    case 'closed':
      return 'CLOSED';
    default:
      return 'PENDING';
  }
}

/** API deliverable -> UI Deliverable. */
function mapDeliverable(raw: RawDeliverable): Deliverable {
  return {
    task_id: String(raw.taskId),
    deliverable_no: raw.deliverableNo,
    content: raw.description,
    status: mapDeliverableStatus(raw.status),
    createdAt: raw.createdAt,
    feedback: raw.feedback ?? null,
  };
}

/** API application status -> UI status ('declined' becomes REJECTED). */
function mapApplicationStatus(status: RawApplication['status']): Application['status'] {
  switch (status) {
    case 'shortlisted':
      return 'SHORTLISTED';
    case 'accepted':
      return 'ACCEPTED';
    case 'declined':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
}

/** API application -> UI Application. */
function mapApplication(raw: RawApplication): Application {
  return {
    application_id: String(raw.applicationId),
    task_id: String(raw.taskId),
    task_title: raw.task?.title ?? '',
    gig_profile_id: String(raw.gigProfileId),
    candidate_name: raw.gigProfile?.user?.name ?? 'Unknown Candidate',
    // No dedicated "role" column on GIG_PROFESSIONAL_PROFILE — bio is the
    // closest descriptive field available.
    candidate_role: raw.gigProfile?.bio || 'Gig Professional',
    status: mapApplicationStatus(raw.status),
    rating: raw.rating ?? undefined,
    hourlyRate: raw.hourlyRate ? Number(raw.hourlyRate) : undefined,
    rate: raw.task?.budget ? Number(raw.task.budget) : 0,
    createdAt: raw.createdAt,
    // Service-hire tasks are tagged with the special skill 'Service Hire' by the backend.
    is_service_request: raw.task?.skills?.includes('Service Hire') ?? false,
  };
}

/** API service -> UI Service (tags become a plain skills list). */
function mapService(raw: RawService): Service {
  return {
    service_id: String(raw.serviceId),
    title: raw.title,
    price: Number(raw.price),
    description: raw.description ?? '',
    skills: (raw.tags ?? []).map((t) => t.tag),
    gig_profile_id: String(raw.gigProfileId),
    user: raw.profile?.user ? { name: raw.profile.user.name, email: raw.profile.user.email } : undefined,
  };
}

/** A pending invite -> manager row (kind 'invite'). */
function mapInviteToManagerInvite(raw: RawManagerInvite): ManagerInvite {
  return {
    invite_id: String(raw.inviteId),
    client_id: String(raw.clientId),
    name: raw.name,
    email: raw.email,
    status: raw.status === 'accepted' ? 'ACCEPTED' : 'PENDING',
    createdAt: raw.createdAt,
    invite_link: raw.inviteLink,
    kind: 'invite',
  };
}

/** An active manager -> manager row (kind 'manager'). */
function mapManagerToManagerInvite(raw: RawManager): ManagerInvite {
  return {
    invite_id: String(raw.managerId),
    client_id: String(raw.clientId),
    name: raw.user?.name ?? '',
    email: raw.user?.email ?? '',
    status: 'ACCEPTED',
    // MANAGER has no created_at column in the schema.
    createdAt: '',
    kind: 'manager',
  };
}

/**
 * Holds all data for the logged-in client and the actions that change it.
 * Pattern for every action: clear the error, call the API, then re-fetch the
 * lists that the change affects so the UI always shows server truth.
 */
export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<ManagerInvite[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [requestedServices, setRequestedServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Show the API's message (or a generic one) and re-throw so the calling page can react too.
  const handleError = (err: unknown): never => {
    const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
    setError(message);
    throw err;
  };

  // ---- Loaders: fetch a list, map it to UI shape, store it. On failure, log,
  // surface the message (401s are handled by AuthContext), and show an empty list.

  const refreshTasks = useCallback(async () => {
    try {
      const raw = await apiFetch<RawTask[]>('/tasks', { method: 'GET', actor: 'client' });
      setTasks((raw || []).map(mapTask));
    } catch (err) {
      console.error('Error fetching client tasks:', err);
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
      setTasks([]);
    }
  }, []);

  const refreshApplications = useCallback(async () => {
    try {
      const raw = await apiFetch<RawApplication[]>('/applications', { method: 'GET', actor: 'client' });
      setApplications((raw || []).map(mapApplication));
    } catch (err) {
      console.error('Error fetching applications:', err);
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
      setApplications([]);
    }
  }, []);

  const refreshContracts = useCallback(async () => {
    try {
      const raw = await apiFetch<RawContract[]>('/contracts', { method: 'GET', actor: 'client' });
      setContracts((raw || []).map(mapContract));
    } catch (err) {
      console.error('Error fetching client contracts:', err);
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
      setContracts([]);
    }
  }, []);

  const refreshServices = useCallback(async () => {
    try {
      const raw = await apiFetch<RawService[]>('/services', { method: 'GET', actor: 'client' });
      setServices((raw || []).map(mapService));
    } catch (err) {
      console.error('Error fetching services:', err);
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
      setServices([]);
    }
  }, []);

  // Remembers which services were already requested, so the "Request" button can be disabled.
  const refreshServiceRequests = useCallback(async () => {
    try {
      const raw = await apiFetch<RawServiceRequest[]>('/requests', { method: 'GET', actor: 'client' });
      setRequestedServices(new Set((raw || []).map((r) => String(r.serviceId))));
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setRequestedServices(new Set());
    }
  }, []);

  // Manager list = active managers + still-pending invites, merged into one list.
  const refreshManagers = useCallback(async () => {
    try {
      const [invites, realManagers] = await Promise.all([
        apiFetch<RawManagerInvite[]>('/manager-invites', { method: 'GET', actor: 'client' }),
        apiFetch<RawManager[]>('/managers', { method: 'GET', actor: 'client' }),
      ]);
      setManagers([
        ...(realManagers || []).map(mapManagerToManagerInvite),
        ...(invites || []).filter((i) => i.status === 'pending').map(mapInviteToManagerInvite),
      ]);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setManagers([]);
    }
  }, []);

  // Initial load for the authenticated client.
  useEffect(() => {
    if (user?.role !== 'CLIENT') return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          refreshTasks(),
          refreshApplications(),
          refreshContracts(),
          refreshServices(),
          refreshServiceRequests(),
          refreshManagers(),
        ]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load your workspace data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, refreshTasks, refreshApplications, refreshContracts, refreshServices, refreshServiceRequests, refreshManagers]);

  // ---- Actions (called from client pages) ----

  /** Post a new task. Skills default to ['Full-Stack', 'React'] when none given. */
  const addTask = async (
    title: string,
    description: string,
    budget: number,
    category?: string,
    duration?: string,
    skills?: string,
  ) => {
    setError(null);
    const parsedSkills = parseSkills(skills) || ['Full-Stack', 'React'];

    try {
      await apiFetch('/tasks', {
        method: 'POST',
        actor: 'client',
        body: { title, description, budget, category, duration, skills: parsedSkills },
      });
      await refreshTasks();
    } catch (err) {
      handleError(err);
    }
  };

  /** Edit an existing task. */
  const updateTask = async (
    taskId: string,
    title: string,
    description: string,
    budget: number,
    category?: string,
    duration?: string,
    skills?: string,
  ) => {
    setError(null);
    const parsedSkills = parseSkills(skills) || ['Full-Stack', 'React'];
    try {
      const numericId = toNumericId(taskId);
      await apiFetch(`/tasks/${numericId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { title, description, budget, category, duration, skills: parsedSkills },
      });
      await refreshTasks();
    } catch (err) {
      handleError(err);
    }
  };

  /** Delete a task (also refreshes contracts, since a contract may disappear). */
  const deleteTask = async (taskId: string) => {
    setError(null);
    try {
      const numericId = toNumericId(taskId);
      await apiFetch(`/tasks/${numericId}`, { method: 'DELETE', actor: 'client' });
      await Promise.all([refreshTasks(), refreshContracts()]);
    } catch (err) {
      handleError(err);
    }
  };

  /** Creates (or re-sends) an invite and returns its one-time activation link. */
  const inviteManager = async (name: string, email: string): Promise<string | undefined> => {
    setError(null);
    try {
      const invite = await apiFetch<RawManagerInvite>('/manager-invites', {
        method: 'POST',
        actor: 'client',
        body: { name, email },
      });
      await refreshManagers();
      return invite.inviteLink;
    } catch (err) {
      handleError(err);
    }
  };

  /** Cancel a pending manager invite. */
  const revokeManagerInvite = async (inviteId: string) => {
    setError(null);
    try {
      await apiFetch(`/manager-invites/${Number(inviteId)}`, { method: 'DELETE', actor: 'client' });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

  /** Rename / change email of an active manager (pending invites can't be edited). */
  const updateManager = async (inviteId: string, name: string, email: string) => {
    setError(null);
    const target = managers.find((m) => m.invite_id === inviteId);
    if (!target || target.kind !== 'manager') {
      const message =
        'This manager has only been invited and has not accepted yet, so there is nothing to edit — invites cannot be modified.';
      setError(message);
      throw new Error(message);
    }
    try {
      const numericId = toNumericId(inviteId);
      await apiFetch(`/managers/${numericId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { name, email },
      });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

  /** Remove an active manager (pending invites must be revoked instead). */
  const deleteManager = async (inviteId: string) => {
    setError(null);
    const target = managers.find((m) => m.invite_id === inviteId);
    if (!target || target.kind !== 'manager') {
      const message =
        'This manager has only been invited and has not accepted yet, so there is nothing to remove yet.';
      setError(message);
      throw new Error(message);
    }
    try {
      const numericId = toNumericId(inviteId);
      await apiFetch(`/managers/${numericId}`, { method: 'DELETE', actor: 'client' });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

  /** Load deliverables for one task, replacing any previously loaded ones for that task. */
  const fetchTaskDeliverables = async (taskId: string) => {
    setError(null);
    try {
      const numericId = toNumericId(taskId);
      const raw = await apiFetch<RawDeliverable[]>(`/tasks/${numericId}/deliverables`, {
        method: 'GET',
        actor: 'client',
      });
      setDeliverables((prev) => [...prev.filter((d) => d.task_id !== taskId), ...raw.map(mapDeliverable)]);
    } catch (err) {
      handleError(err);
    }
  };

  // Shared by approve/reject. Deliverable id on the API is "<taskId>-<deliverableNo>"; feedback is capped at 500 chars.
  const reviewDeliverable = async (
    taskId: string,
    deliverableNo: number,
    status: 'approved' | 'revision_requested',
    feedback?: string,
  ) => {
    const numericTaskId = toNumericId(taskId);
    await apiFetch(`/deliverables/${numericTaskId}-${deliverableNo}`, {
      method: 'PATCH',
      actor: 'client',
      body: { status, ...(feedback?.trim() ? { feedback: feedback.trim().slice(0, 500) } : {}) },
    });
    await Promise.all([fetchTaskDeliverables(taskId), refreshTasks(), refreshContracts()]);
  };

  const approveDeliverable = async (taskId: string, deliverableNo: number) => {
    setError(null);
    try {
      await reviewDeliverable(taskId, deliverableNo, 'approved');
    } catch (err) {
      handleError(err);
    }
  };

  const rejectDeliverable = async (taskId: string, deliverableNo: number, feedback?: string) => {
    setError(null);
    try {
      await reviewDeliverable(taskId, deliverableNo, 'revision_requested', feedback);
    } catch (err) {
      handleError(err);
    }
  };

  /** Accept an application -> the gig pro is hired (creates a contract). */
  const hireCandidate = async (applicationId: string) => {
    setError(null);
    try {
      const numericId = toNumericId(applicationId);
      await apiFetch(`/applications/${numericId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { status: 'accepted' },
      });
      await Promise.all([refreshApplications(), refreshContracts(), refreshTasks()]);
    } catch (err) {
      handleError(err);
    }
  };

  // Simulated escrow: the client pays gig amount + platform fee, or releases it once all work is approved.
  const payTask = async (taskId: string) => {
    setError(null);
    try {
      await apiFetch('/payments/pay', { method: 'POST', actor: 'client', body: { taskId } });
      await refreshContracts();
    } catch (err) {
      handleError(err);
    }
  };

  /** Release escrowed money to the gig pro once the work is approved. */
  const releasePayment = async (taskId: string) => {
    setError(null);
    try {
      await apiFetch('/payments/release', { method: 'POST', actor: 'client', body: { taskId } });
      await Promise.all([refreshContracts(), refreshTasks()]);
    } catch (err) {
      handleError(err);
    }
  };

  /** Hand a task to a manager (null = client supervises it). */
  const assignTaskManager = async (taskId: string, managerId: number | null) => {
    setError(null);
    try {
      await apiFetch(`/tasks/${Number(taskId)}/manager`, { method: 'PATCH', actor: 'client', body: { managerId } });
      await refreshContracts();
    } catch (err) {
      handleError(err);
    }
  };

  /** Decline an application. */
  const rejectCandidate = async (applicationId: string) => {
    setError(null);
    try {
      const numericId = toNumericId(applicationId);
      await apiFetch(`/applications/${numericId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { status: 'declined' },
      });
      await refreshApplications();
    } catch (err) {
      handleError(err);
    }
  };

  /** Ask a gig pro to do one of their services. 409 = already requested, which we treat as success. */
  const requestService = async (serviceId: string) => {
    setError(null);
    try {
      const numericId = toNumericId(serviceId);
      await apiFetch(`/services/${numericId}/requests`, { method: 'POST', actor: 'client' });
      setRequestedServices((prev) => new Set(prev).add(serviceId));
      await Promise.all([refreshContracts(), refreshTasks()]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setRequestedServices((prev) => new Set(prev).add(serviceId));
        return;
      }
      handleError(err);
    }
  };

  /** Rate the gig pro on a completed task. */
  const submitReview = async (taskId: number, rating: number, comment?: string) => {
    setError(null);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        actor: 'client',
        body: { taskId, rating, ...(comment?.trim() ? { comment: comment.trim() } : {}) },
      });
      await refreshContracts();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <ClientContextInstance.Provider value={{
      tasks,
      managers,
      services,
      contracts,
      deliverables,
      applications,
      loading,
      error,
      addTask,
      updateTask,
      deleteTask,
      inviteManager,
      revokeManagerInvite,
      updateManager,
      deleteManager,
      fetchTaskDeliverables,
      approveDeliverable,
      rejectDeliverable,
      hireCandidate,
      payTask,
      releasePayment,
      assignTaskManager,
      rejectCandidate,
      requestService,
      requestedServices,
      refreshContracts,
      submitReview,
    }}>
      {children}
    </ClientContextInstance.Provider>
  );
};

/** Access client data/actions. Must be used inside <ClientProvider>. */
export const useClient = () => {
  const context = useContext(ClientContextInstance);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default ClientProvider;
