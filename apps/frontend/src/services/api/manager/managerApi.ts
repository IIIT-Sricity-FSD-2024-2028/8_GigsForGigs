import type {
  ManagerProfile,
  ManagerTask,
  Deliverable,
  TalentProfile,
  CreateDeliverableDto,
  ReviewDeliverableDto,
  UpdateManagerProfileDto
} from '../../../types/manager';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('g4g_manager_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Fallback initial state for offline/demo scenarios
let mockProfile: ManagerProfile = {
  managerId: 1,
  userId: 102,
  clientId: 5,
  user: {
    userId: 102,
    name: 'Leo Hudson',
    email: 'leo.hudson@gigsforgigs.com',
    role: 'manager'
  },
  client: {
    clientId: 5,
    clientName: 'TechCorp Solutions',
    domain: 'Software Engineering'
  }
};

let mockTasks: ManagerTask[] = [
  {
    taskId: 101,
    clientId: 5,
    title: 'REST API Development',
    description: 'Build robust REST APIs using Node.js, Express, and PostgreSQL for core marketplace workflows.',
    budget: 25000,
    dueDate: '2026-09-15',
    status: 'in_progress',
    progress: 50,
    client: {
      clientId: 5,
      clientName: 'TechCorp Solutions'
    },
    assignments: [
      {
        gigProfileId: 201,
        taskId: 101,
        managerId: 1,
        gigProfile: {
          gigProfileId: 201,
          userId: 301,
          bio: 'Senior Backend Developer with 6+ years experience in Node & PostgreSQL',
          user: {
            userId: 301,
            name: 'Arham Kansal',
            email: 'arham@gigsforgigs.com'
          },
          skills: ['NestJS', 'TypeScript', 'PostgreSQL', 'REST API']
        }
      }
    ],
    deliverables: [
      {
        taskId: 101,
        deliverableNo: 1,
        gigProfileId: 201,
        description: 'Initial DB Schema & Prisma Migration Setup',
        submissionPath: 'https://github.com/techcorp/api-v1/pull/12',
        status: 'approved',
        createdAt: '2026-08-20',
        gigProfile: { user: { name: 'Arham Kansal' } }
      },
      {
        taskId: 101,
        deliverableNo: 2,
        gigProfileId: 201,
        description: 'Authentication Endpoints & JWT Integration',
        submissionPath: 'https://github.com/techcorp/api-v1/pull/15',
        status: 'submitted',
        createdAt: '2026-08-24',
        gigProfile: { user: { name: 'Arham Kansal' } }
      }
    ]
  },
  {
    taskId: 102,
    clientId: 5,
    title: 'Mobile App Wireframes',
    description: 'Create high-fidelity mobile UI/UX wireframes for iOS & Android.',
    budget: 18000,
    dueDate: '2026-09-30',
    status: 'open',
    progress: 0,
    client: {
      clientId: 5,
      clientName: 'TechCorp Solutions'
    },
    assignments: [
      {
        gigProfileId: 202,
        taskId: 102,
        managerId: 1,
        gigProfile: {
          gigProfileId: 202,
          userId: 302,
          bio: 'UI/UX Specialist passionate about modern SaaS products',
          user: {
            userId: 302,
            name: 'Elena Torres',
            email: 'elena@gigsforgigs.com'
          },
          skills: ['Figma', 'UI/UX', 'Mobile Design']
        }
      }
    ],
    deliverables: []
  }
];

let mockTalents: TalentProfile[] = [
  {
    gigProfileId: 201,
    userId: 301,
    name: 'NestJS REST API (CRUD + Auth)',
    bio: 'I will build a clean NestJS REST API with validation, role-based access, and in-memory persistence for demos.',
    price: 20000,
    skills: ['NESTJS', 'TYPESCRIPT', 'REST', 'API'],
    tools: ['PostgreSQL', 'Docker', 'Swagger'],
    portfolio: ['https://github.com/arham/nestjs-demo'],
    status: 'active'
  },
  {
    gigProfileId: 202,
    userId: 302,
    name: 'SaaS UI/UX Design Pack',
    bio: 'Wireframes + high-fidelity screens for onboarding, dashboard, and settings, optimized for modern SaaS.',
    price: 15000,
    skills: ['UI', 'UX', 'FIGMA', 'SAAS'],
    tools: ['Figma', 'Adobe XD'],
    portfolio: ['https://dribbble.com/elenatorres'],
    status: 'active'
  },
  {
    gigProfileId: 203,
    userId: 303,
    name: 'Logo & Brand Refresh',
    bio: 'A modern logo refresh plus simple brand guidelines (color + typography) for consistent marketing.',
    price: 7000,
    skills: ['BRANDING', 'LOGO', 'DESIGN'],
    tools: ['Illustrator', 'Photoshop'],
    portfolio: ['https://behance.net/jordanlee'],
    status: 'active'
  }
];

export const managerApi = {
  // Authentication
  login: async (email: string, pass: string): Promise<{ success: boolean; token?: string; user?: any }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/manager/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('g4g_manager_token', data.token);
        return data;
      }
    } catch {
      // Fallback
    }
    const token = 'demo_manager_token_123';
    localStorage.setItem('g4g_manager_token', token);
    return {
      success: true,
      token,
      user: mockProfile.user
    };
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      await fetch(`${API_BASE_URL}/auth/manager/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch {
      // Fallback
    }
    localStorage.removeItem('g4g_manager_token');
    return { success: true };
  },

  // GET /api/managers/me
  getProfile: async (): Promise<ManagerProfile> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return mockProfile;
  },

  // PATCH /api/managers/me
  updateProfile: async (dto: UpdateManagerProfileDto): Promise<ManagerProfile> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    if (dto.name) mockProfile.user.name = dto.name;
    if (dto.email) mockProfile.user.email = dto.email;
    return { ...mockProfile };
  },

  // GET /api/managers/me/tasks
  getAssignedTasks: async (): Promise<ManagerTask[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return mockTasks;
  },

  // GET /api/managers/me/tasks/{taskId}
  getTaskById: async (taskId: number): Promise<ManagerTask | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const found = mockTasks.find(t => t.taskId === taskId);
    return found || mockTasks[0] || null;
  },

  // GET /api/managers/me/tasks/{taskId}/deliverables
  getTaskDeliverables: async (taskId: number): Promise<Deliverable[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}/deliverables`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const task = mockTasks.find(t => t.taskId === taskId);
    return task?.deliverables || [];
  },

  // POST /api/managers/me/tasks/{taskId}/deliverables
  createDeliverable: async (taskId: number, dto: CreateDeliverableDto): Promise<Deliverable> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}/deliverables`, {
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
    const task = mockTasks.find(t => t.taskId === taskId);
    const newNo = task && task.deliverables ? task.deliverables.length + 1 : 1;
    const newDel: Deliverable = {
      taskId,
      deliverableNo: newNo,
      gigProfileId: dto.gigProfileId,
      description: dto.description,
      submissionPath: dto.submissionPath,
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
      gigProfile: { user: { name: 'Assigned Gig Pro' } }
    };
    if (task) {
      if (!task.deliverables) task.deliverables = [];
      task.deliverables.push(newDel);
    }
    return newDel;
  },

  // GET /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}
  getDeliverableByNo: async (taskId: number, deliverableNo: number): Promise<Deliverable | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}/deliverables/${deliverableNo}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const task = mockTasks.find(t => t.taskId === taskId);
    return task?.deliverables?.find(d => d.deliverableNo === deliverableNo) || null;
  },

  // PATCH /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}/review
  reviewDeliverable: async (taskId: number, deliverableNo: number, dto: ReviewDeliverableDto): Promise<Deliverable> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}/deliverables/${deliverableNo}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const task = mockTasks.find(t => t.taskId === taskId);
    const del = task?.deliverables?.find(d => d.deliverableNo === deliverableNo);
    if (del) {
      del.status = dto.status;
    }
    return del || { taskId, deliverableNo, gigProfileId: 1, description: '', submissionPath: '', status: dto.status };
  },

  // PATCH /api/managers/me/tasks/{taskId}/deliverables/{deliverableNo}/close
  closeDeliverable: async (taskId: number, deliverableNo: number): Promise<Deliverable> => {
    try {
      const res = await fetch(`${API_BASE_URL}/managers/me/tasks/${taskId}/deliverables/${deliverableNo}/close`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const task = mockTasks.find(t => t.taskId === taskId);
    const del = task?.deliverables?.find(d => d.deliverableNo === deliverableNo);
    if (del) {
      del.status = 'closed';
    }
    // recalculate progress
    if (task && task.deliverables && task.deliverables.length > 0) {
      const closedCount = task.deliverables.filter(d => d.status === 'approved' || d.status === 'closed').length;
      task.progress = Math.round((closedCount / task.deliverables.length) * 100);
      if (task.progress === 100) task.status = 'completed';
    }
    return del || { taskId, deliverableNo, gigProfileId: 1, description: '', submissionPath: '', status: 'closed' };
  },

  // Search Talent
  searchTalent: async (query?: string): Promise<TalentProfile[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gig/professionals${query ? `?q=${query}` : ''}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return mockTalents;
  }
};

export default managerApi;
