/**
 * @file marketplaceStore.ts
 * @description
 * Synchronized Multi-Actor Marketplace State Store for GigsForGigs.
 * Ensures complete synchronization across Client, Manager, Gig Professional, and Super Admin
 * for both FLOW A (Service Posting -> Talent Discovery -> Hire -> Accept -> Active Task)
 * and FLOW B (Task Posting -> Application -> Accept -> Active Task), with unified
 * Active Task, Deliverables, Payment, and Tri-Directional Review systems.
 */

export interface MarketplaceService {
  service_id: string;
  gig_profile_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  thumbnail?: string;
  status: 'LIVE' | 'AVAILABLE' | 'HIRED';
  user: { name: string; email: string };
  createdAt: string;
}

export interface MarketplaceTask {
  task_id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  client_id: string;
  client_name: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

export interface PendingHiringRequest {
  request_id: string;
  service_id?: string;
  task_id?: string;
  title: string;
  description: string;
  budget: number;
  client_id: string;
  client_name: string;
  manager_name?: string;
  gig_profile_id: string;
  gig_name: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface TaskDeliverableItem {
  deliverable_no: number;
  description: string;
  submission_path: string;
  status: 'SUBMITTED' | 'MANAGER_APPROVED' | 'REVISION_REQUESTED' | 'CLIENT_APPROVED';
  manager_feedback?: string;
  client_feedback?: string;
  createdAt: string;
}

export interface ActiveContractItem {
  contract_id: string;
  task_id: string;
  task_title: string;
  client_id: string;
  client_name: string;
  manager_name?: string;
  gig_profile_id: string;
  gig_pro_name: string;
  budget: number;
  platform_fee: number;
  total_paid: number;
  payment_status: 'PAYMENT_REQUIRED' | 'PAYMENT_SECURED' | 'PAYMENT_COMPLETED';
  progress: number;
  status: 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED';
  deliverables: TaskDeliverableItem[];
  reviews: {
    client_to_gig?: { rating: number; comment: string; createdAt: string };
    manager_to_gig?: { rating: number; comment: string; createdAt: string };
    gig_to_client?: { rating: number; comment: string; createdAt: string };
  };
  createdAt: string;
  completedAt?: string;
}

const STORAGE_KEYS = {
  SERVICES: 'g4g_sync_services',
  TASKS: 'g4g_sync_tasks',
  REQUESTS: 'g4g_sync_requests',
  CONTRACTS: 'g4g_sync_contracts'
};

const INITIAL_SERVICES: MarketplaceService[] = [
  {
    service_id: 'srv-101',
    gig_profile_id: 'gig-01',
    title: 'Full-Stack React 19 & Express.js Marketplace App',
    description: 'End-to-end full-stack web application development including PostgreSQL database schema design, RESTful APIs, and responsive React frontend.',
    price: 5000,
    category: 'Software Development',
    tags: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    status: 'LIVE',
    user: { name: 'Dessie Davis', email: 'dessie8@yahoo.com' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    service_id: 'srv-102',
    gig_profile_id: 'gig-01',
    title: 'UI/UX Brand Guidelines & Design System Design',
    description: 'Comprehensive brand identity package including color palette, typography hierarchy, component library, and Figma design system.',
    price: 3500,
    category: 'Design & Creative',
    tags: ['UI/UX Design', 'Figma', 'Branding'],
    status: 'LIVE',
    user: { name: 'Dessie Davis', email: 'dessie8@yahoo.com' },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    service_id: 'srv-103',
    gig_profile_id: 'gig-02',
    title: 'SEO Copywriting & Technical Documentation',
    description: 'High-conversion landing page copy, user manuals, and technical API documentation tailored for enterprise B2B audiences.',
    price: 2000,
    category: 'Writing & Translation',
    tags: ['Copywriting', 'SEO', 'Technical Writing'],
    status: 'LIVE',
    user: { name: 'Elena Rodriguez', email: 'elena@gigsforgigs.dev' },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

const INITIAL_TASKS: MarketplaceTask[] = [
  {
    task_id: 'tsk-101',
    title: 'Corporate Marketplace Redesign & RBAC Integration',
    description: 'Refactor existing marketplace frontend to React 19 and implement strict role-based access control workflows.',
    budget: 5000,
    category: 'Software Development',
    client_id: 'client-01',
    client_name: 'Julian Lynch',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    task_id: 'tsk-102',
    title: 'Mobile App Wireframes & Interactive Prototype',
    description: 'Design 12 high-fidelity mobile prototype screens in Figma for freelance hiring workflows.',
    budget: 3000,
    category: 'Design & Creative',
    client_id: 'client-01',
    client_name: 'Julian Lynch',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const INITIAL_CONTRACTS: ActiveContractItem[] = [
  {
    contract_id: 'ctr-101',
    task_id: '101',
    task_title: 'Full Stack Marketplace Optimization',
    client_id: 'client-01',
    client_name: 'Julian Lynch',
    manager_name: 'Curtis Smith',
    gig_profile_id: 'gig-01',
    gig_pro_name: 'Dessie Davis',
    budget: 5000,
    platform_fee: 100,
    total_paid: 5100,
    payment_status: 'PAYMENT_SECURED',
    progress: 75,
    status: 'IN_PROGRESS',
    deliverables: [
      {
        deliverable_no: 1,
        description: 'Complete PostgreSQL schema migrations & Express route endpoints',
        submission_path: 'https://github.com/gigsforgigs/marketplace/pull/14',
        status: 'MANAGER_APPROVED',
        manager_feedback: 'Code architecture looks great and adheres to all Prisma patterns.',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    reviews: {},
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const marketplaceStore = {
  // ── Services (FLOW A) ───────────────────────────────────────────────────
  getServices: (): MarketplaceService[] => {
    return loadFromStorage<MarketplaceService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  getServicesByGig: (gigNameOrEmail?: string): MarketplaceService[] => {
    const all = marketplaceStore.getServices();
    if (!gigNameOrEmail) return all;
    return all.filter(
      (s) =>
        s.user?.email?.toLowerCase() === gigNameOrEmail.toLowerCase() ||
        s.user?.name?.toLowerCase() === gigNameOrEmail.toLowerCase()
    );
  },

  addService: (service: Omit<MarketplaceService, 'service_id' | 'createdAt' | 'status'>): MarketplaceService => {
    const all = marketplaceStore.getServices();
    const newService: MarketplaceService = {
      ...service,
      service_id: 'srv-' + Date.now(),
      status: 'LIVE',
      createdAt: new Date().toISOString()
    };
    all.unshift(newService);
    saveToStorage(STORAGE_KEYS.SERVICES, all);
    return newService;
  },

  // ── Tasks (FLOW B) ──────────────────────────────────────────────────────
  getTasks: (): MarketplaceTask[] => {
    return loadFromStorage<MarketplaceTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },

  addTask: (task: Omit<MarketplaceTask, 'task_id' | 'createdAt' | 'status'>): MarketplaceTask => {
    const all = marketplaceStore.getTasks();
    const newTask: MarketplaceTask = {
      ...task,
      task_id: 'tsk-' + Date.now(),
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    all.unshift(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, all);
    return newTask;
  },

  // ── Hiring Requests (FLOW A Handshake) ──────────────────────────────────
  getPendingRequests: (): PendingHiringRequest[] => {
    return loadFromStorage<PendingHiringRequest[]>(STORAGE_KEYS.REQUESTS, [
      {
        request_id: 'req-101',
        service_id: 'srv-101',
        title: 'Full-Stack React 19 & Express.js Marketplace App',
        description: 'We need full development for a responsive marketplace interface with manager supervision.',
        budget: 5000,
        client_id: 'client-01',
        client_name: 'Julian Lynch',
        manager_name: 'Curtis Smith',
        gig_profile_id: 'gig-01',
        gig_name: 'Dessie Davis',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    ]);
  },

  createHiringRequest: (params: {
    serviceId: string;
    clientName: string;
    clientId?: string;
    managerName?: string;
    notes?: string;
  }): PendingHiringRequest => {
    const allServices = marketplaceStore.getServices();
    const targetService = allServices.find((s) => s.service_id === params.serviceId) || allServices[0];

    const requests = marketplaceStore.getPendingRequests();
    const newReq: PendingHiringRequest = {
      request_id: 'req-' + Date.now(),
      service_id: targetService.service_id,
      title: targetService.title,
      description: params.notes || targetService.description,
      budget: targetService.price,
      client_id: params.clientId || 'client-01',
      client_name: params.clientName || 'Julian Lynch',
      manager_name: params.managerName,
      gig_profile_id: targetService.gig_profile_id,
      gig_name: targetService.user?.name || 'Dessie Davis',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    requests.unshift(newReq);
    saveToStorage(STORAGE_KEYS.REQUESTS, requests);
    return newReq;
  },

  acceptHiringRequest: (requestId: string): ActiveContractItem | null => {
    const requests = marketplaceStore.getPendingRequests();
    const target = requests.find((r) => r.request_id === requestId);
    if (!target) return null;

    target.status = 'ACCEPTED';
    saveToStorage(STORAGE_KEYS.REQUESTS, requests);

    // Create Active Contract
    const contracts = marketplaceStore.getContracts();
    const newContract: ActiveContractItem = {
      contract_id: 'ctr-' + Date.now(),
      task_id: 'tsk-' + Date.now(),
      task_title: target.title,
      client_id: target.client_id,
      client_name: target.client_name,
      manager_name: target.manager_name,
      gig_profile_id: target.gig_profile_id,
      gig_pro_name: target.gig_name,
      budget: target.budget,
      platform_fee: 100,
      total_paid: target.budget + 100,
      payment_status: 'PAYMENT_REQUIRED',
      progress: 0,
      status: 'IN_PROGRESS',
      deliverables: [],
      reviews: {},
      createdAt: new Date().toISOString()
    };

    contracts.unshift(newContract);
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return newContract;
  },

  // ── Unified Active Contracts Lifecycle ──────────────────────────────────
  getContracts: (): ActiveContractItem[] => {
    return loadFromStorage<ActiveContractItem[]>(STORAGE_KEYS.CONTRACTS, INITIAL_CONTRACTS);
  },

  payForContract: (contractId: string): boolean => {
    const contracts = marketplaceStore.getContracts();
    const target = contracts.find((c) => c.contract_id === contractId || c.task_id === contractId);
    if (!target) return false;

    target.payment_status = 'PAYMENT_SECURED';
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return true;
  },

  submitDeliverable: (contractId: string, description: string, submissionPath: string): boolean => {
    const contracts = marketplaceStore.getContracts();
    const target = contracts.find((c) => c.contract_id === contractId || c.task_id === contractId);
    if (!target) return false;

    const newDel: TaskDeliverableItem = {
      deliverable_no: (target.deliverables.length || 0) + 1,
      description,
      submission_path: submissionPath,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };

    target.deliverables.push(newDel);
    target.status = 'REVIEWING';
    target.progress = Math.min(100, target.progress + 30);
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return true;
  },

  reviewDeliverableByManager: (
    contractId: string,
    deliverableNo: number,
    status: 'MANAGER_APPROVED' | 'REVISION_REQUESTED',
    feedback?: string
  ): boolean => {
    const contracts = marketplaceStore.getContracts();
    const target = contracts.find((c) => c.contract_id === contractId || c.task_id === contractId);
    if (!target) return false;

    const del = target.deliverables.find((d) => d.deliverable_no === deliverableNo);
    if (!del) return false;

    del.status = status;
    del.manager_feedback = feedback;
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return true;
  },

  approveDeliverableByClient: (contractId: string, deliverableNo: number): boolean => {
    const contracts = marketplaceStore.getContracts();
    const target = contracts.find((c) => c.contract_id === contractId || c.task_id === contractId);
    if (!target) return false;

    const del = target.deliverables.find((d) => d.deliverable_no === deliverableNo);
    if (del) {
      del.status = 'CLIENT_APPROVED';
    }

    target.progress = 100;
    target.status = 'COMPLETED';
    target.payment_status = 'PAYMENT_COMPLETED';
    target.completedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return true;
  },

  // ── Tri-Directional Reviews ─────────────────────────────────────────────
  addReview: (
    contractId: string,
    type: 'client_to_gig' | 'manager_to_gig' | 'gig_to_client',
    rating: number,
    comment: string
  ): boolean => {
    const contracts = marketplaceStore.getContracts();
    const target = contracts.find((c) => c.contract_id === contractId || c.task_id === contractId);
    if (!target) return false;

    // Gig can review Client ONLY after payment completion
    if (type === 'gig_to_client' && target.payment_status !== 'PAYMENT_COMPLETED') {
      throw new Error('Gig Professional can only review Client after payment completion.');
    }

    target.reviews[type] = {
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return true;
  }
};

export default marketplaceStore;

