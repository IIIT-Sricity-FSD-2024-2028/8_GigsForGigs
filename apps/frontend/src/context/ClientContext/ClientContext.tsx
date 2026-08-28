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
 *  - TASKS has no category/duration/skills columns — PostGig's form fields
 *    for those are UI-only and are never persisted or returned by the API.
 *  - There is no accept-invite endpoint anywhere in the backend, so a row
 *    created via POST /manager-invites can never become a row returned by
 *    GET /managers through any exposed API today.
 *  - APPLICATION has no rating/hourly-rate/role/reviewing-manager columns;
 *    ReviewShortlist's "rating"/"rate"/"shortlisted by" concepts have no
 *    backing data and are approximated or omitted (see that page).
 */

export interface Task {
  task_id: string;
  title: string;
  description: string;
  budget: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  dueDate?: string | null;
  // NOT backed by the TASKS table — see file header gap note. Always
  // undefined once a task round-trips through the real API.
  skills?: string[];
  category?: string;
  duration?: string;
}

export interface ManagerInvite {
  invite_id: string;
  client_id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  /**
   * 'invite' = a MANAGER_INVITE row (from GET /manager-invites) that has not
   * (and, given the current backend, never will) become a real MANAGER row.
   * 'manager' = an actual MANAGER row (from GET /managers) that supports
   * PATCH/DELETE via /managers/:managerId. Only 'manager' rows can be
   * edited/deleted for real.
   */
  kind: 'invite' | 'manager';
}

export interface Service {
  service_id: string;
  title: string;
  price: number;
  description: string;
  skills: string[];
  user?: { name: string; email: string };
  gig_profile_id: string;
}

export interface Contract {
  contract_id: string;
  task_id: string;
  task_title: string;
  gig_pro_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'REVIEWING';
  progress: number;
  budget: number;
  createdAt: string;
}

export interface Deliverable {
  task_id: string;
  deliverable_no: number;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'CLOSED';
  createdAt: string;
  feedback?: string | null;
}

export interface Application {
  application_id: string;
  task_id: string;
  task_title: string;
  gig_profile_id: string;
  candidate_name: string;
  candidate_role: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  // Neither exists on APPLICATION/GIG_PROFESSIONAL_PROFILE in the schema —
  // left optional/derived rather than fabricated. See file header gap note.
  rating?: number;
  rate: number;
  createdAt: string;
}

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
  updateTask: (taskId: string, title: string, description: string, budget: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  inviteManager: (name: string, email: string) => Promise<void>;
  updateManager: (inviteId: string, name: string, email: string) => Promise<void>;
  deleteManager: (inviteId: string) => Promise<void>;
  fetchTaskDeliverables: (taskId: string) => Promise<void>;
  approveDeliverable: (taskId: string, deliverableNo: number) => Promise<void>;
  rejectDeliverable: (taskId: string, deliverableNo: number) => Promise<void>;
  hireCandidate: (applicationId: string) => Promise<void>;
  rejectCandidate: (applicationId: string) => Promise<void>;
  requestService: (serviceId: string) => Promise<void>;
  requestedServices: Set<string>;
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
  status: 'pending' | 'accepted' | 'declined';
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
  budget: string;
  createdAt: string;
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
}

interface RawManager {
  managerId: number;
  clientId: number;
  userId: number;
  user: RawUser;
}

// ---- Mapping helpers (raw API shape -> internal UI shape) -----------------

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

function mapTask(raw: RawTask): Task {
  return {
    task_id: String(raw.taskId),
    title: raw.title,
    description: raw.description ?? '',
    budget: Number(raw.budget),
    status: mapTaskStatus(raw.status),
    createdAt: raw.createdAt,
    dueDate: raw.dueDate,
  };
}

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
    createdAt: raw.createdAt,
  };
}

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

function mapApplicationStatus(status: RawApplication['status']): Application['status'] {
  switch (status) {
    case 'accepted':
      return 'ACCEPTED';
    case 'declined':
      return 'REJECTED';
    default:
      // 'pending' is the only actionable state a client reviews — there is
      // no distinct backend-side "shortlisted" status.
      return 'SHORTLISTED';
  }
}

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
    rate: raw.task?.budget ? Number(raw.task.budget) : 0,
    createdAt: raw.createdAt,
  };
}

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

function mapInviteToManagerInvite(raw: RawManagerInvite): ManagerInvite {
  return {
    invite_id: String(raw.inviteId),
    client_id: String(raw.clientId),
    name: raw.name,
    email: raw.email,
    status: raw.status === 'accepted' ? 'ACCEPTED' : 'PENDING',
    createdAt: raw.createdAt,
    kind: 'invite',
  };
}

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

  const handleError = (err: unknown): never => {
    const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
    setError(message);
    throw err;
  };

  const refreshTasks = useCallback(async () => {
    const raw = await apiFetch<RawTask[]>('/tasks', { method: 'GET', actor: 'client' });
    setTasks(raw.map(mapTask));
  }, []);

  const refreshApplications = useCallback(async () => {
    const raw = await apiFetch<RawApplication[]>('/applications', { method: 'GET', actor: 'client' });
    setApplications(raw.map(mapApplication));
  }, []);

  const refreshContracts = useCallback(async () => {
    const raw = await apiFetch<RawContract[]>('/contracts', { method: 'GET', actor: 'client' });
    setContracts(raw.map(mapContract));
  }, []);

  const refreshServices = useCallback(async () => {
    const raw = await apiFetch<RawService[]>('/services', { method: 'GET', actor: 'client' });
    setServices(raw.map(mapService));
  }, []);

  const refreshServiceRequests = useCallback(async () => {
    const raw = await apiFetch<RawServiceRequest[]>('/requests', { method: 'GET', actor: 'client' });
    setRequestedServices(new Set(raw.map((r) => String(r.serviceId))));
  }, []);

  const refreshManagers = useCallback(async () => {
    const [invites, realManagers] = await Promise.all([
      apiFetch<RawManagerInvite[]>('/manager-invites', { method: 'GET', actor: 'client' }),
      apiFetch<RawManager[]>('/managers', { method: 'GET', actor: 'client' }),
    ]);
    setManagers([
      ...realManagers.map(mapManagerToManagerInvite),
      // Only show invites that have not (yet) produced a real manager row —
      // avoids double-listing once/if an accept flow exists.
      ...invites.filter((i) => i.status !== 'accepted').map(mapInviteToManagerInvite),
    ]);
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

  // category/duration/skills are accepted for call-signature compatibility
  // with PostGig's form but are never sent — TASKS has no columns for them.
  const addTask = async (
    title: string,
    description: string,
    budget: number,
    _category?: string,
    _duration?: string,
    _skills?: string,
  ) => {
    setError(null);
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        actor: 'client',
        body: { title, description, budget },
      });
      await refreshTasks();
    } catch (err) {
      handleError(err);
    }
  };

  const updateTask = async (taskId: string, title: string, description: string, budget: number) => {
    setError(null);
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { title, description, budget },
      });
      await refreshTasks();
    } catch (err) {
      handleError(err);
    }
  };

  const deleteTask = async (taskId: string) => {
    setError(null);
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE', actor: 'client' });
      await Promise.all([refreshTasks(), refreshContracts()]);
    } catch (err) {
      handleError(err);
    }
  };

  const inviteManager = async (name: string, email: string) => {
    setError(null);
    try {
      await apiFetch('/manager-invites', {
        method: 'POST',
        actor: 'client',
        body: { name, email },
      });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

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
      await apiFetch(`/managers/${inviteId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { name, email },
      });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

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
      await apiFetch(`/managers/${inviteId}`, { method: 'DELETE', actor: 'client' });
      await refreshManagers();
    } catch (err) {
      handleError(err);
    }
  };

  const fetchTaskDeliverables = async (taskId: string) => {
    setError(null);
    try {
      const raw = await apiFetch<RawDeliverable[]>(`/tasks/${taskId}/deliverables`, {
        method: 'GET',
        actor: 'client',
      });
      setDeliverables((prev) => [...prev.filter((d) => d.task_id !== taskId), ...raw.map(mapDeliverable)]);
    } catch (err) {
      handleError(err);
    }
  };

  const reviewDeliverable = async (
    taskId: string,
    deliverableNo: number,
    status: 'approved' | 'revision_requested',
  ) => {
    await apiFetch(`/deliverables/${taskId}-${deliverableNo}`, {
      method: 'PATCH',
      actor: 'client',
      body: { status },
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

  const rejectDeliverable = async (taskId: string, deliverableNo: number) => {
    setError(null);
    try {
      await reviewDeliverable(taskId, deliverableNo, 'revision_requested');
    } catch (err) {
      handleError(err);
    }
  };

  const hireCandidate = async (applicationId: string) => {
    setError(null);
    try {
      await apiFetch(`/applications/${applicationId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { status: 'accepted' },
      });
      await Promise.all([refreshApplications(), refreshContracts(), refreshTasks()]);
    } catch (err) {
      handleError(err);
    }
  };

  const rejectCandidate = async (applicationId: string) => {
    setError(null);
    try {
      await apiFetch(`/applications/${applicationId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { status: 'declined' },
      });
      await refreshApplications();
    } catch (err) {
      handleError(err);
    }
  };

  const requestService = async (serviceId: string) => {
    setError(null);
    try {
      await apiFetch(`/services/${serviceId}/requests`, { method: 'POST', actor: 'client' });
      setRequestedServices((prev) => new Set(prev).add(serviceId));
    } catch (err) {
      // Already-requested is a 409 — treat it as success from the UI's
      // point of view rather than surfacing an error for a no-op action.
      if (err instanceof ApiError && err.status === 409) {
        setRequestedServices((prev) => new Set(prev).add(serviceId));
        return;
      }
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
      updateManager,
      deleteManager,
      fetchTaskDeliverables,
      approveDeliverable,
      rejectDeliverable,
      hireCandidate,
      rejectCandidate,
      requestService,
      requestedServices,
    }}>
      {children}
    </ClientContextInstance.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContextInstance);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default ClientProvider;
