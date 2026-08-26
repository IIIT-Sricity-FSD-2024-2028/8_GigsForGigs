export interface UserRef {
  userId: number;
  name: string;
  email: string;
  role: 'client' | 'gig_professional' | 'manager';
}

export interface ClientRef {
  clientId: number;
  clientName: string;
  domain?: string | null;
}

export interface ManagerProfile {
  managerId: number;
  userId: number;
  clientId: number;
  user: UserRef;
  client?: ClientRef;
}

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

export interface Deliverable {
  taskId: number;
  deliverableNo: number;
  gigProfileId: number;
  description: string;
  submissionPath: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'closed';
  createdAt?: string;
  gigProfile?: {
    user: {
      name: string;
    };
  };
}

export interface TaskAssignment {
  gigProfileId: number;
  taskId: number;
  managerId: number;
  assignedAt?: string;
  gigProfile?: GigProfessionalRef;
}

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

export interface CreateDeliverableDto {
  gigProfileId: number;
  description: string;
  submissionPath: string;
}

export interface ReviewDeliverableDto {
  status: 'approved' | 'revision_requested';
  feedback?: string;
}

export interface UpdateManagerProfileDto {
  name?: string;
  email?: string;
  password?: string;
}
