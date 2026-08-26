/**
 * @file gigApi.ts
 * @description
 * Primary API service client for the Gig Professional module.
 * Implements methods to interact with backend `/api/gig` routes with seamless fallback
 * to rich mock data when backend services are offline or in standalone mode.
 */

import type {
  GigProfile,
  GigTask,
  PendingRequest,
  CompletedProject,
  EarningsSummary,
  GigService,
  CreateServiceDto,
  SubmitDeliverableDto,
  GigDeliverable
} from '../../../types/gig';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('g4g_gig_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Initial mock dataset for offline/demonstration environment.
 */
let mockGigProfile: GigProfile = {
  gig_profile_id: 'gig-01',
  user_id: 'usr-gig-01',
  name: 'Elena Rodriguez',
  email: 'elena.rodriguez@gigsforgigs.com',
  bio: 'Full-stack software developer & UI designer with 5+ years experience building scalable Web Apps, React dashboards, and RESTful microservices.',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Figma', 'GraphQL'],
  portfolio: ['https://github.com/elena/ecommerce-dashboard', 'https://dribbble.com/elena-designs'],
  tools: ['VS Code', 'Docker', 'Postman', 'Vite', 'Git'],
  rating: 4.9,
  jobSuccessRate: 98,
  completedProjectsCount: 14
};

let mockActiveTasks: GigTask[] = [
  {
    task_id: 'task-101',
    title: 'E-Commerce Frontend React Components',
    description: 'Develop responsive product catalog, filtering UI, cart sidebar, and checkout workflow using React & TypeScript.',
    client_id: 'cli-01 (TechCorp Solutions)',
    budget: 3500,
    status: 'IN_PROGRESS',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-24T14:30:00Z',
    deliverables: [
      {
        deliverable_id: 'del-1',
        deliverable_no: 1,
        task_id: 'task-101',
        gig_profile_id: 'gig-01',
        content: 'Product Grid & Filter Components implemented: https://github.com/techcorp/frontend/pull/4',
        notes: 'Includes dark mode styling and accessibility compliance.',
        createdAt: '2026-08-20T16:00:00Z'
      }
    ]
  },
  {
    task_id: 'task-102',
    title: 'PostgreSQL Database Performance Tuning',
    description: 'Optimize indexing strategies, write single-pass aggregate CTE queries, and reduce query execution latency below 20ms.',
    client_id: 'cli-03 (Fintech Global)',
    budget: 4800,
    status: 'IN_PROGRESS',
    createdAt: '2026-08-18T09:15:00Z',
    updatedAt: '2026-08-25T11:20:00Z',
    deliverables: []
  }
];

let mockPendingRequests: PendingRequest[] = [
  {
    application_id: 'req-201',
    task_id: 'task-103',
    gig_profile_id: 'gig-01',
    status: 'PENDING',
    budget: 2800,
    createdAt: '2026-08-25T08:30:00Z',
    task: {
      task_id: 'task-103',
      title: 'Mobile App Wireframes & Figma Prototype',
      description: 'Create high-fidelity interactive prototyping screens for iOS and Android onboarding flows.',
      client_id: 'cli-04 (NextGen Mobility)',
      budget: 2800,
      createdAt: '2026-08-25T08:30:00Z'
    }
  },
  {
    application_id: 'req-202',
    task_id: 'task-104',
    gig_profile_id: 'gig-01',
    status: 'PENDING',
    budget: 1500,
    createdAt: '2026-08-26T07:10:00Z',
    task: {
      task_id: 'task-104',
      title: 'REST API JWT Security Audit',
      description: 'Audit Express RBAC middleware and implement fast token revocation safeguards.',
      client_id: 'cli-01 (TechCorp Solutions)',
      budget: 1500,
      createdAt: '2026-08-26T07:10:00Z'
    }
  }
];

let mockMarketplaceTasks: GigTask[] = [
  {
    task_id: 'mkt-301',
    title: 'GraphQL API Gateway Integration',
    description: 'Build single entry-point GraphQL gateway unifying microservice REST APIs for client web portal.',
    client_id: 'cli-05 (CloudData Systems)',
    budget: 4200,
    status: 'OPEN',
    createdAt: '2026-08-24T12:00:00Z'
  },
  {
    task_id: 'mkt-302',
    title: 'Design System & Token Library Creation',
    description: 'Extract and standardize CSS variables, HSL color tokens, and atomic button/input UI components.',
    client_id: 'cli-02 (DesignCraft Studio)',
    budget: 2600,
    status: 'OPEN',
    createdAt: '2026-08-23T14:45:00Z'
  },
  {
    task_id: 'mkt-303',
    title: 'Real-time WebSocket Notification Hub',
    description: 'Implement Node.js + Socket.io backend server for live chat alerts and task milestone updates.',
    client_id: 'cli-06 (Streamline Media)',
    budget: 3800,
    status: 'OPEN',
    createdAt: '2026-08-22T18:30:00Z'
  }
];

let mockCompletedProjects: CompletedProject[] = [
  {
    task_id: 'comp-401',
    title: 'Custom Analytics Dashboard Implementation',
    description: 'Built dynamic SVG charts, key performance indicator widgets, and CSV export functionality.',
    client_id: 'cli-01 (TechCorp Solutions)',
    budget: 5000,
    status: 'COMPLETED',
    completedAt: '2026-08-10',
    reviews: [
      {
        review_id: 'rev-1',
        rating: 5,
        comment: 'Exceptional deliverable quality! Clean React code and fast execution.',
        client_name: 'TechCorp Solutions',
        createdAt: '2026-08-11'
      }
    ],
    payment: {
      payment_id: 'pay-701',
      task_id: 'comp-401',
      gig_profile_id: 'gig-01',
      amount: 5000,
      paidAt: '2026-08-11'
    }
  },
  {
    task_id: 'comp-402',
    title: 'Authentication & RBAC Middleware Module',
    description: 'Engineered multi-role JWT verification and route guard protection in Express.js.',
    client_id: 'cli-03 (Fintech Global)',
    budget: 3200,
    status: 'COMPLETED',
    completedAt: '2026-07-28',
    reviews: [
      {
        review_id: 'rev-2',
        rating: 5,
        comment: 'Great security awareness and precise API documentation.',
        client_name: 'Fintech Global',
        createdAt: '2026-07-29'
      }
    ],
    payment: {
      payment_id: 'pay-702',
      task_id: 'comp-402',
      gig_profile_id: 'gig-01',
      amount: 3200,
      paidAt: '2026-07-29'
    }
  }
];

let mockServices: GigService[] = [
  {
    service_id: 'srv-501',
    gig_profile_id: 'gig-01',
    title: 'Full-Stack React + Node.js Web App Development',
    description: 'End-to-end web application development featuring clean React UI, Express backend API, and database setup.',
    price: 1200,
    tags: ['React', 'Node.js', 'Full-Stack'],
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    createdAt: '2026-08-01'
  },
  {
    service_id: 'srv-502',
    gig_profile_id: 'gig-01',
    title: 'Database Design & SQL Performance Optimization',
    description: 'PostgreSQL schema architectural design, indexing strategy, and single-pass aggregation query tuning.',
    price: 800,
    tags: ['PostgreSQL', 'SQL', 'Database'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
    createdAt: '2026-08-05'
  }
];

export const gigApi = {
  /**
   * Fetch active tasks assigned to the current Gig Professional.
   */
  getActiveTasks: async (): Promise<GigTask[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/tasks/active`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // Fallback to mock data
    }
    return mockActiveTasks;
  },

  /**
   * Fetch pending task requests/applications.
   */
  getPendingRequests: async (): Promise<PendingRequest[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/requests/pending`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // Fallback
    }
    return mockPendingRequests;
  },

  /**
   * Fetch completed projects portfolio.
   */
  getCompletedProjects: async (): Promise<CompletedProject[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/projects/completed`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // Fallback
    }
    return mockCompletedProjects;
  },

  /**
   * Fetch total earnings and payments ledger.
   */
  getEarnings: async (): Promise<EarningsSummary> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/earnings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const completedTasksCount = mockCompletedProjects.length;
    const payments = mockCompletedProjects.map(p => p.payment).filter(Boolean) as any[];
    const totalEarnings = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    return {
      totalEarnings,
      completedTasks: completedTasksCount,
      payments
    };
  },

  /**
   * Fetch marketplace open tasks available for application.
   */
  getMarketplaceTasks: async (): Promise<GigTask[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/tasks/marketplace`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // Fallback
    }
    return mockMarketplaceTasks;
  },

  /**
   * Apply for an open task in marketplace.
   */
  applyForTask: async (taskId: string): Promise<{ success: boolean; taskId: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/applications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return { success: true, taskId };
  },

  /**
   * Accept or decline an incoming task request.
   */
  respondToRequest: async (applicationId: string, action: 'accepted' | 'declined'): Promise<{ success: boolean }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/requests/${applicationId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const idx = mockPendingRequests.findIndex(r => r.application_id === applicationId);
    if (idx !== -1) {
      const req = mockPendingRequests[idx];
      if (action === 'accepted' && req.task) {
        mockActiveTasks.push({
          task_id: req.task.task_id,
          title: req.task.title,
          description: req.task.description,
          client_id: req.task.client_id,
          budget: req.task.budget,
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
          deliverables: []
        });
      }
      mockPendingRequests.splice(idx, 1);
    }
    return { success: true };
  },

  /**
   * Fetch current Gig Professional profile.
   */
  getProfile: async (): Promise<GigProfile> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/profile`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return mockGigProfile;
  },

  /**
   * Update Gig Professional profile details.
   */
  updateProfile: async (patch: Partial<GigProfile>): Promise<GigProfile> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    mockGigProfile = {
      ...mockGigProfile,
      ...patch
    };
    return mockGigProfile;
  },

  /**
   * Fetch services posted by current Gig Professional.
   */
  getServices: async (): Promise<GigService[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/services/mine`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // Fallback
    }
    return mockServices;
  },

  /**
   * Post a new service listing.
   */
  postService: async (dto: CreateServiceDto): Promise<GigService> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const newService: GigService = {
      service_id: `srv-${Date.now()}`,
      gig_profile_id: mockGigProfile.gig_profile_id,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      tags: dto.tags,
      thumbnail: dto.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      createdAt: new Date().toISOString().split('T')[0]
    };
    mockServices.push(newService);
    return newService;
  },

  /**
   * Submit deliverable for an active task.
   */
  submitDeliverable: async (dto: SubmitDeliverableDto): Promise<GigDeliverable> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/deliverables`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const task = mockActiveTasks.find(t => t.task_id === dto.taskId);
    const delNo = task && task.deliverables ? task.deliverables.length + 1 : 1;
    const newDeliverable: GigDeliverable = {
      deliverable_id: `del-${Date.now()}`,
      deliverable_no: delNo,
      task_id: dto.taskId,
      gig_profile_id: mockGigProfile.gig_profile_id,
      content: dto.content,
      notes: dto.notes,
      createdAt: new Date().toISOString()
    };
    if (task) {
      if (!task.deliverables) task.deliverables = [];
      task.deliverables.push(newDeliverable);
    }
    return newDeliverable;
  }
};

export default gigApi;
