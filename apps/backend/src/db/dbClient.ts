/**
 * @file dbClient.ts
 * @description
 * High-performance persistence layer providing complete transactional CRUD operations
 * for all platform entities (Users, Clients, Freelancers, Managers, Tasks, Payments,
 * Reviews, Disputes, Invitations, Audit Logs, Platform Settings).
 */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CLIENT' | 'GIG_PROFESSIONAL';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';
  joinedDate: string;
  avatarUrl?: string;
  tokenVersion: number;
}

export interface ClientRecord {
  id: string;
  userId: string;
  name: string;
  companyName: string;
  email: string;
  domain: string;
  totalSpent: number;
  activeGigsCount: number;
  assignedManagersCount: number;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC';
  joinedDate: string;
}

export interface GigProRecord {
  id: string;
  userId: string;
  name: string;
  headline: string;
  category: string;
  skills: string[];
  hourlyRate: number;
  completedJobs: number;
  rating: number;
  badge: 'NONE' | 'VERIFIED_PRO' | 'TOP_RATED';
  status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  portfolioCount: number;
}

export interface ManagerRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  linkedClients: string[];
  activeSupervisedTasks: number;
  permissionsLevel: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface TaskRecord {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  gigProName?: string;
  gigProId?: string;
  managerName?: string;
  managerId?: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  category: string;
  deliverablesCount: number;
  submittedDeliverables: number;
  createdAt: string;
  dueDate: string;
}

export interface PaymentRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  clientName: string;
  gigProName: string;
  grossAmount: number;
  platformRake: number;
  netPayout: number;
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  reviewerName: string;
  reviewerRole: 'CLIENT' | 'GIG_PROFESSIONAL';
  targetUserName: string;
  rating: number;
  comment: string;
  flagCount: number;
  flagReason?: string;
  status: 'APPROVED' | 'FLAGGED' | 'HIDDEN';
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  filedByName: string;
  filedByRole: 'CLIENT' | 'GIG_PROFESSIONAL';
  againstName: string;
  disputeAmount: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  slaHoursLeft: number;
  createdAt: string;
}

export interface AdminStaffRecord {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';
  permissions: string[];
  isTwoFactorEnabled: boolean;
  lastLogin: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface AdminInvitationRecord {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  token: string;
  assignedPassword: string;
  inviteLink: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  diffSummary: string;
  ipAddress: string;
  createdAt: string;
}

export interface PlatformConfigRecord {
  platformRakePercentage: number;
  minimumGigBudget: number;
  escrowHoldingDays: number;
  maxFileUploadMb: number;
  isMaintenanceMode: boolean;
  allowedCategories: string[];
}

class InMemoryDatabase {
  users: UserRecord[] = [
    { id: 'usr-01', name: 'Chaitanya Anand', email: 'chaitanya.admin@gigsforgigs.internal', password: 'password123', role: 'SUPER_ADMIN', status: 'ACTIVE', joinedDate: '2026-01-10', tokenVersion: 1 },
    { id: 'usr-jovan', name: 'Jovan Miller', email: 'jovan44@yahoo.com', password: 'password123', role: 'SUPER_ADMIN', status: 'ACTIVE', joinedDate: '2026-01-15', tokenVersion: 1 },
    { id: 'usr-curtis', name: 'Curtis Smith', email: 'curtis45@hotmail.com', password: 'password123', role: 'MANAGER', status: 'ACTIVE', joinedDate: '2026-02-01', tokenVersion: 1 },
    { id: 'usr-julian', name: 'Julian Lynch', email: 'julian_lynch7@gmail.com', password: 'password123', role: 'CLIENT', status: 'ACTIVE', joinedDate: '2026-02-01', tokenVersion: 1 },
    { id: 'usr-dessie', name: 'Dessie Davis', email: 'dessie8@yahoo.com', password: 'password123', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', joinedDate: '2026-02-10', tokenVersion: 1 },
    { id: 'usr-02', name: 'Sarah Finance', email: 'sarah.finance@gigsforgigs.internal', password: 'password123', role: 'SUPER_ADMIN', status: 'ACTIVE', joinedDate: '2026-02-14', tokenVersion: 1 },
    { id: 'usr-03', name: 'Alex Support', email: 'alex.support@gigsforgigs.internal', password: 'password123', role: 'SUPER_ADMIN', status: 'ACTIVE', joinedDate: '2026-03-01', tokenVersion: 1 },
    { id: 'usr-04', name: 'Leo Hudson', email: 'aditya@techstart.io', password: 'password123', role: 'MANAGER', status: 'ACTIVE', joinedDate: '2026-03-15', tokenVersion: 1 },
    { id: 'usr-05', name: 'Aditya Deshmukh', email: 'aditya@gigsforgigs.com', password: 'password123', role: 'CLIENT', status: 'ACTIVE', joinedDate: '2026-02-01', tokenVersion: 1 },
    { id: 'usr-06', name: 'Elena Rodriguez', email: 'elena.rodriguez@freelance.dev', password: 'password123', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', joinedDate: '2026-01-20', tokenVersion: 1 },
    { id: 'usr-07', name: 'Marcus Chen', email: 'marcus.chen@designcraft.io', password: 'password123', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', joinedDate: '2026-02-10', tokenVersion: 1 },
    { id: 'usr-08', name: 'Sarah Jenkins', email: 'sarah.j@aisolutions.ai', password: 'password123', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', joinedDate: '2026-03-05', tokenVersion: 1 }
  ];

  clients: ClientRecord[] = [
    { id: 'cli-01', userId: 'usr-05', name: 'Aditya Deshmukh', companyName: 'TechStart Labs', email: 'aditya@gigsforgigs.com', domain: 'FinTech & AI Platforms', totalSpent: 148500, activeGigsCount: 4, assignedManagersCount: 2, isVerified: true, status: 'ACTIVE', joinedDate: '2026-02-01' },
    { id: 'cli-02', userId: 'usr-09', name: 'David Vance', companyName: 'Apex Creative Studios', email: 'david@apexstudios.com', domain: '3D Spatial & Visual FX', totalSpent: 89400, activeGigsCount: 2, assignedManagersCount: 1, isVerified: true, status: 'ACTIVE', joinedDate: '2026-03-11' },
    { id: 'cli-03', userId: 'usr-10', name: 'Amara Okafor', companyName: 'Quantum Health AI', email: 'amara@quantumhealth.io', domain: 'Bio-Medical & Telehealth', totalSpent: 215000, activeGigsCount: 6, assignedManagersCount: 3, isVerified: true, status: 'ACTIVE', joinedDate: '2026-01-15' },
    { id: 'cli-04', userId: 'usr-11', name: 'Liam Scott', companyName: 'Starlight E-Commerce', email: 'liam@starlight.co', domain: 'Global Retail & Logistics', totalSpent: 34200, activeGigsCount: 1, assignedManagersCount: 1, isVerified: false, status: 'PENDING_KYC', joinedDate: '2026-08-18' }
  ];

  gigPros: GigProRecord[] = [
    { id: 'gig-01', userId: 'usr-06', name: 'Elena Rodriguez', headline: 'Staff TypeScript & Cloud Architect', category: 'Software Development', skills: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'], hourlyRate: 95, completedJobs: 38, rating: 4.95, badge: 'TOP_RATED', status: 'ACTIVE', portfolioCount: 12 },
    { id: 'gig-02', userId: 'usr-07', name: 'Marcus Chen', headline: 'Senior 3D & WebGL Spatial Designer', category: '3D & Spatial Computing', skills: ['Three.js', 'Blender', 'WebGL', 'GLSL Shaders', 'Figma'], hourlyRate: 85, completedJobs: 24, rating: 4.88, badge: 'VERIFIED_PRO', status: 'ACTIVE', portfolioCount: 18 },
    { id: 'gig-03', userId: 'usr-08', name: 'Sarah Jenkins', headline: 'Computer Vision & PyTorch Engineer', category: 'AI & Data Science', skills: ['PyTorch', 'Computer Vision', 'FastAPI', 'CUDA', 'Python'], hourlyRate: 110, completedJobs: 19, rating: 4.98, badge: 'TOP_RATED', status: 'ACTIVE', portfolioCount: 9 },
    { id: 'gig-04', userId: 'usr-12', name: 'Vikram Patel', headline: 'Brand Identity & Design System Specialist', category: 'Design & Creative', skills: ['Design Systems', 'Figma', 'Typography', 'Logo Design'], hourlyRate: 65, completedJobs: 42, rating: 4.75, badge: 'VERIFIED_PRO', status: 'ACTIVE', portfolioCount: 22 }
  ];

  managers: ManagerRecord[] = [
    { id: 'mgr-01', userId: 'usr-04', name: 'Leo Hudson', email: 'aditya@techstart.io', department: 'Enterprise Platform Delivery', linkedClients: ['TechStart Labs', 'Quantum Health AI'], activeSupervisedTasks: 8, permissionsLevel: 'FULL_SUPERVISOR', status: 'ACTIVE' },
    { id: 'mgr-02', userId: 'usr-13', name: 'Marcus Vance', email: 'marcus.vance@nexus.com', department: 'Creative & Spatial Operations', linkedClients: ['Apex Creative Studios'], activeSupervisedTasks: 4, permissionsLevel: 'TECHNICAL_LEAD', status: 'ACTIVE' }
  ];

  tasks: TaskRecord[] = [
    { id: 'tsk-101', title: 'Enterprise RBAC Authentication & Session Engine', clientName: 'TechStart Labs', clientId: 'cli-01', gigProName: 'Elena Rodriguez', gigProId: 'gig-01', managerName: 'Leo Hudson', managerId: 'mgr-01', budget: 3500, status: 'IN_PROGRESS', category: 'Software Development', deliverablesCount: 3, submittedDeliverables: 2, createdAt: '2026-08-10', dueDate: '2026-09-15' },
    { id: 'tsk-102', title: 'Real-Time Financial Escrow Ledger & Webhooks', clientName: 'TechStart Labs', clientId: 'cli-01', gigProName: 'Elena Rodriguez', gigProId: 'gig-01', managerName: 'Leo Hudson', managerId: 'mgr-01', budget: 4800, status: 'IN_PROGRESS', category: 'Software Development', deliverablesCount: 4, submittedDeliverables: 1, createdAt: '2026-08-14', dueDate: '2026-09-20' },
    { id: 'tsk-103', title: 'Spatial WebGL 3D Product Configurator', clientName: 'Apex Creative Studios', clientId: 'cli-02', gigProName: 'Marcus Chen', gigProId: 'gig-02', managerName: 'Marcus Vance', managerId: 'mgr-02', budget: 5200, status: 'OPEN', category: '3D & Spatial Computing', deliverablesCount: 3, submittedDeliverables: 0, createdAt: '2026-08-20', dueDate: '2026-10-01' },
    { id: 'tsk-104', title: 'Medical Image Classification Pipeline (DICOM/MRI)', clientName: 'Quantum Health AI', clientId: 'cli-03', gigProName: 'Sarah Jenkins', gigProId: 'gig-03', managerName: 'Leo Hudson', managerId: 'mgr-01', budget: 8500, status: 'REVIEWING', category: 'AI & Data Science', deliverablesCount: 4, submittedDeliverables: 4, createdAt: '2026-07-28', dueDate: '2026-08-30' },
    { id: 'tsk-105', title: 'Complete Brand Identity & Vector Design System', clientName: 'Starlight E-Commerce', clientId: 'cli-04', gigProName: 'Vikram Patel', gigProId: 'gig-04', budget: 2400, status: 'COMPLETED', category: 'Design & Creative', deliverablesCount: 2, submittedDeliverables: 2, createdAt: '2026-07-15', dueDate: '2026-08-10' }
  ];

  payments: PaymentRecord[] = [
    { id: 'pay-001', taskId: 'tsk-101', taskTitle: 'Enterprise RBAC Authentication & Session Engine', clientName: 'TechStart Labs', gigProName: 'Elena Rodriguez', grossAmount: 3500, platformRake: 350, netPayout: 3150, escrowStatus: 'HELD_IN_ESCROW', createdAt: '2026-08-10' },
    { id: 'pay-002', taskId: 'tsk-102', taskTitle: 'Real-Time Financial Escrow Ledger & Webhooks', clientName: 'TechStart Labs', gigProName: 'Elena Rodriguez', grossAmount: 4800, platformRake: 480, netPayout: 4320, escrowStatus: 'HELD_IN_ESCROW', createdAt: '2026-08-14' },
    { id: 'pay-003', taskId: 'tsk-104', taskTitle: 'Medical Image Classification Pipeline', clientName: 'Quantum Health AI', gigProName: 'Sarah Jenkins', grossAmount: 8500, platformRake: 850, netPayout: 7650, escrowStatus: 'HELD_IN_ESCROW', createdAt: '2026-07-28' },
    { id: 'pay-004', taskId: 'tsk-105', taskTitle: 'Complete Brand Identity & Vector Design System', clientName: 'Starlight E-Commerce', gigProName: 'Vikram Patel', grossAmount: 2400, platformRake: 240, netPayout: 2160, escrowStatus: 'RELEASED', createdAt: '2026-07-15' },
    { id: 'pay-005', taskId: 'tsk-099', taskTitle: 'Legacy Microservice Migration Refactor', clientName: 'TechStart Labs', gigProName: 'Elena Rodriguez', grossAmount: 1800, platformRake: 180, netPayout: 1620, escrowStatus: 'REFUNDED', createdAt: '2026-07-02' }
  ];

  reviews: ReviewRecord[] = [
    { id: 'rev-01', taskId: 'tsk-105', taskTitle: 'Complete Brand Identity & Vector Design System', reviewerName: 'Liam Scott', reviewerRole: 'CLIENT', targetUserName: 'Vikram Patel', rating: 5, comment: 'Phenomenal work! Delivered clean vector assets and full token documentation ahead of deadline.', flagCount: 0, status: 'APPROVED', createdAt: '2026-08-11' },
    { id: 'rev-02', taskId: 'tsk-099', taskTitle: 'Legacy Microservice Migration Refactor', reviewerName: 'Aditya Deshmukh', reviewerRole: 'CLIENT', targetUserName: 'Alex Developer', rating: 1, comment: 'Horrible contractor did not deliver anything on time and used rude language throughout.', flagCount: 2, flagReason: 'Profanity & Retaliatory Content', status: 'FLAGGED', createdAt: '2026-07-05' }
  ];

  disputes: DisputeRecord[] = [
    { id: 'disp-089', taskId: 'tsk-102', taskTitle: 'Real-Time Financial Escrow Ledger & Webhooks', filedByName: 'TechStart Labs', filedByRole: 'CLIENT', againstName: 'Elena Rodriguez', disputeAmount: 4800, reason: 'Milestone scope mismatch on webhook delivery specifications', description: 'Client alleges webhook events do not match the API spec provided in kickoff milestone.', evidenceUrls: ['https://s3.amazonaws.com/gfg/evidence/kickoff_spec.pdf', 'https://s3.amazonaws.com/gfg/evidence/api_logs.json'], status: 'UNDER_REVIEW', slaHoursLeft: 14, createdAt: '2026-08-25 09:14' },
    { id: 'disp-090', taskId: 'tsk-104', taskTitle: 'Medical Image Classification Pipeline', filedByName: 'Sarah Jenkins', filedByRole: 'GIG_PROFESSIONAL', againstName: 'Quantum Health AI', disputeAmount: 2500, reason: 'Unreasonable milestone review delays and out-of-scope requests', description: 'Freelancer delivered 98.4% model accuracy exceeding the 95% contract SLA, but client is withholding milestone approval.', evidenceUrls: ['https://s3.amazonaws.com/gfg/evidence/eval_benchmark.pdf'], status: 'OPEN', slaHoursLeft: 38, createdAt: '2026-08-26 11:30' }
  ];

  adminStaff: AdminStaffRecord[] = [
    { id: 'adm-01', name: 'Chaitanya Anand', email: 'chaitanya.admin@gigsforgigs.internal', role: 'OWNER', permissions: ['*'], isTwoFactorEnabled: true, lastLogin: 'Active Now', status: 'ACTIVE' },
    { id: 'adm-02', name: 'Sarah Jenkins (Finance)', email: 'sarah.finance@gigsforgigs.internal', role: 'FINANCIAL_ADMIN', permissions: ['payments:read', 'payments:refund', 'payments:release', 'settings:manage'], isTwoFactorEnabled: true, lastLogin: '2 hours ago', status: 'ACTIVE' },
    { id: 'adm-03', name: 'Alex Morales', email: 'alex.support@gigsforgigs.internal', role: 'SUPPORT_ADMIN', permissions: ['users:read', 'users:ban', 'disputes:read', 'disputes:resolve'], isTwoFactorEnabled: false, lastLogin: 'Yesterday', status: 'ACTIVE' }
  ];

  invitations: AdminInvitationRecord[] = [];

  auditLogs: AuditLogRecord[] = [
    { id: 'log-001', adminName: 'Chaitanya Anand', adminEmail: 'chaitanya.admin@gigsforgigs.internal', action: 'UPDATE_PLATFORM_RAKE', targetType: 'PLATFORM_CONFIG', targetId: 'cfg-01', diffSummary: 'Adjusted commission rake to 10.0%', ipAddress: '192.168.1.42', createdAt: '2026-08-25 10:30' },
    { id: 'log-002', adminName: 'Chaitanya Anand', adminEmail: 'chaitanya.admin@gigsforgigs.internal', action: 'ARBITRATE_DISPUTE', targetType: 'DISPUTE_CASE', targetId: 'disp-089', diffSummary: 'Split settlement ruling issued (60% refund / 40% payout)', ipAddress: '192.168.1.42', createdAt: '2026-08-25 09:14' }
  ];

  platformConfig: PlatformConfigRecord = {
    platformRakePercentage: 10.0,
    minimumGigBudget: 50,
    escrowHoldingDays: 14,
    maxFileUploadMb: 100,
    isMaintenanceMode: false,
    allowedCategories: [
      'Software Development',
      'Design & Creative',
      'AI & Data Science',
      '3D & Spatial Computing',
      'Writing & Translation',
      'Digital Marketing',
      'Video & Motion Graphics',
      'Finance & Accounting'
    ]
  };
}

export const db = new InMemoryDatabase();
