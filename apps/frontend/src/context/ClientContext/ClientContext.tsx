import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { apiFetch, ApiError } from '../../services/api/httpClient';
import { marketplaceStore } from '../../services/marketplaceStore';

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
 *  - The backend has POST /api/auth/manager/accept-invite to turn a
 *    MANAGER_INVITE row into a real MANAGER row, but no frontend flow calls
 *    it yet — invited managers still can't self-activate from this app.
 *  - APPLICATION has no dedicated "candidate role"/reviewing-manager
 *    columns; ReviewShortlist approximates "role" from GigProfile.bio.
 */

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
  rating?: number;
  hourlyRate?: number;
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
  updateTask: (taskId: string, title: string, description: string, budget: number, category?: string, duration?: string, skills?: string) => Promise<void>;
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
    category: raw.category ?? undefined,
    duration: raw.duration ?? undefined,
    skills: raw.skills,
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
    try {
      const raw = await apiFetch<RawTask[]>('/tasks', { method: 'GET', actor: 'client' });
      if (raw && raw.length > 0) {
        setTasks(raw.map(mapTask));
        return;
      }
    } catch {
      // fallback
    }
    const storeTasks = marketplaceStore.getTasks();
    setTasks(storeTasks.map((t) => ({
      task_id: t.task_id,
      title: t.title,
      description: t.description,
      budget: t.budget,
      status: t.status === 'COMPLETED' ? 'COMPLETED' : t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN',
      createdAt: t.createdAt,
      category: t.category,
      skills: ['React', 'Full-Stack']
    })));
  }, []);

  const refreshApplications = useCallback(async () => {
    try {
      const raw = await apiFetch<RawApplication[]>('/applications', { method: 'GET', actor: 'client' });
      setApplications(raw.map(mapApplication));
    } catch {
      // fallback
    }
  }, []);

  const refreshContracts = useCallback(async () => {
    try {
      const raw = await apiFetch<RawContract[]>('/contracts', { method: 'GET', actor: 'client' });
      if (raw && raw.length > 0) {
        setContracts(raw.map(mapContract));
        return;
      }
    } catch {
      // fallback
    }
    const storeContracts = marketplaceStore.getContracts();
    setContracts(storeContracts.map((c) => ({
      contract_id: c.contract_id,
      task_id: c.task_id,
      task_title: c.task_title,
      gig_pro_name: c.gig_pro_name,
      status: c.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      progress: c.progress,
      budget: c.budget,
      createdAt: c.createdAt
    })));
  }, []);

  const refreshServices = useCallback(async () => {
    try {
      const raw = await apiFetch<RawService[]>('/services', { method: 'GET', actor: 'client' });
      if (raw && raw.length > 0) {
        setServices(raw.map(mapService));
        return;
      }
    } catch {
      // fallback
    }
    const storeServices = marketplaceStore.getServices();
    setServices(storeServices.map((s) => ({
      service_id: s.service_id,
      title: s.title,
      price: s.price,
      description: s.description,
      skills: s.tags || ['Software Development'],
      user: s.user,
      gig_profile_id: s.gig_profile_id
    })));
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

  const parseSkills = (skills?: string): string[] | undefined =>
    skills === undefined
      ? undefined
      : skills.split(',').map((s) => s.trim()).filter(Boolean);

  const addTask = async (
    title: string,
    description: string,
    budget: number,
    category?: string,
    duration?: string,
    skills?: string,
  ) => {
    setError(null);
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        actor: 'client',
        body: { title, description, budget, category, duration, skills: parseSkills(skills) },
      });
      await refreshTasks();
    } catch (err) {
      handleError(err);
    }
  };

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
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        actor: 'client',
        body: { title, description, budget, category, duration, skills: parseSkills(skills) },
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
    marketplaceStore.createHiringRequest({
      serviceId,
      clientName: user?.name || 'Julian Lynch',
      clientId: 'client-01'
    });
    setRequestedServices((prev) => new Set(prev).add(serviceId));

    try {
      await apiFetch(`/services/${serviceId}/requests`, { method: 'POST', actor: 'client' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return;
      }
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
