/**
 * @file adminMockData.ts
 * @description
 * High-fidelity, type-safe mock datasets for the Super Admin frontend vertical.
 * Enables zero-downtime client development while backend Express routes and PostgreSQL
 * database migrations are finalized by teammates.
 */

export interface KPIStats {
  totalUsers: number;
  activeTasks: number;
  grossMerchandiseVolume: number;
  platformRevenue: number;
  pendingDisputes: number;
  avgPlatformRating: number;
  totalClients: number;
  totalGigPros: number;
  totalManagers: number;
  escrowHeld: number;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'GIG_PROFESSIONAL' | 'MANAGER' | 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'PENDING_KYC' | 'SUSPENDED' | 'BANNED';
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface ClientDetail extends UserSummary {
  companyName: string;
  totalSpent: number;
  activeGigsCount: number;
  completedGigsCount: number;
  assignedManagersCount: number;
  domain: string;
}

export interface GigProDetail extends UserSummary {
  headline: string;
  category: string;
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  totalEarnings: number;
  completedProjectsCount: number;
  badge: 'TOP_RATED' | 'VERIFIED_PRO' | 'STANDARD' | 'NONE';
  skills: string[];
}

export interface ManagerDetail extends UserSummary {
  linkedClientId: string;
  linkedClientName: string;
  supervisedTasksCount: number;
  department: string;
}

export interface PlatformProject {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  gigProId?: string;
  gigProName?: string;
  budget: number;
  category: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  dueDate: string;
  createdAt: string;
  milestonesCount: number;
  deliverablesSubmitted: number;
}

export interface PaymentLedgerItem {
  id: string;
  taskId: string;
  taskTitle: string;
  clientName: string;
  gigProName: string;
  grossAmount: number;
  platformRake: number; // e.g. 10%
  netPayout: number;
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  createdAt: string;
}

export interface ModerationReview {
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

export interface DisputeCase {
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

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';
  permissions: string[];
  isTwoFactorEnabled: boolean;
  lastLogin: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface AuditLogEntry {
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

export interface PlatformConfig {
  platformRakePercentage: number;
  minimumGigBudget: number;
  escrowHoldingDays: number;
  isMaintenanceMode: boolean;
  allowedCategories: string[];
  maxFileUploadMb: number;
}

export const mockKPIs: KPIStats = {
  totalUsers: 14820,
  activeTasks: 412,
  grossMerchandiseVolume: 428900,
  platformRevenue: 42890,
  pendingDisputes: 5,
  avgPlatformRating: 4.8,
  totalClients: 4210,
  totalGigPros: 9640,
  totalManagers: 970,
  escrowHeld: 118400
};

export const mockTasksByStatus = [
  { label: 'Open', count: 184, color: '#519e8a' },
  { label: 'In Progress', count: 146, color: '#084b83' },
  { label: 'Reviewing', count: 58, color: '#bf6900' },
  { label: 'Completed', count: 1240, color: '#137333' },
  { label: 'Disputed', count: 24, color: '#c5221f' }
];

export const mockUsersByRole = [
  { label: 'Gig Pros', count: 9640, color: '#084b83' },
  { label: 'Clients', count: 4210, color: '#519e8a' },
  { label: 'Managers', count: 970, color: '#bf6900' }
];

export const mockRevenueVelocity = [
  { date: 'Aug 18', gmv: 12400, rake: 1240 },
  { date: 'Aug 19', gmv: 14800, rake: 1480 },
  { date: 'Aug 20', gmv: 18200, rake: 1820 },
  { date: 'Aug 21', gmv: 16500, rake: 1650 },
  { date: 'Aug 22', gmv: 21900, rake: 2190 },
  { date: 'Aug 23', gmv: 24500, rake: 2450 },
  { date: 'Aug 24', gmv: 28400, rake: 2840 }
];

export const mockRecentUsers: UserSummary[] = [
  { id: 'usr-101', name: 'Sophia Chen', email: 'sophia@novadesign.io', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2026-08-24 22:15' },
  { id: 'usr-102', name: 'Alex Rivera', email: 'alex.code@gmail.com', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', isVerified: true, createdAt: '2026-08-24 21:40' },
  { id: 'usr-103', name: 'Marcus Vance', email: 'marcus@apextech.com', role: 'MANAGER', status: 'ACTIVE', isVerified: false, createdAt: '2026-08-24 19:20' },
  { id: 'usr-104', name: 'Elena Rostova', email: 'elena.art@studio.net', role: 'GIG_PROFESSIONAL', status: 'PENDING_KYC', isVerified: false, createdAt: '2026-08-24 18:05' },
  { id: 'usr-105', name: 'Liam Gallagher', email: 'liam@fintechhub.co', role: 'CLIENT', status: 'SUSPENDED', isVerified: true, createdAt: '2026-08-24 16:30' }
];

export const mockClients: ClientDetail[] = [
  { id: 'cli-01', name: 'Devon Miles', email: 'devon@kineticmedia.com', role: 'CLIENT', status: 'ACTIVE', isVerified: true, companyName: 'Kinetic Media', totalSpent: 48500, activeGigsCount: 4, completedGigsCount: 22, assignedManagersCount: 2, domain: 'Video & Motion', createdAt: '2026-03-12' },
  { id: 'cli-02', name: 'Amina Patel', email: 'amina@prismaventures.io', role: 'CLIENT', status: 'ACTIVE', isVerified: true, companyName: 'Prisma Ventures', totalSpent: 124000, activeGigsCount: 7, completedGigsCount: 54, assignedManagersCount: 4, domain: 'Full-Stack Software', createdAt: '2026-01-08' },
  { id: 'cli-03', name: 'Lucas Sterling', email: 'lucas@cyberdynesys.com', role: 'CLIENT', status: 'PENDING_KYC', isVerified: false, companyName: 'Cyberdyne Systems', totalSpent: 6200, activeGigsCount: 1, completedGigsCount: 2, assignedManagersCount: 1, domain: 'AI & Data Science', createdAt: '2026-08-10' },
  { id: 'cli-04', name: 'Zoe Thorne', email: 'zoe@vividcreative.org', role: 'CLIENT', status: 'SUSPENDED', isVerified: true, companyName: 'Vivid Creative', totalSpent: 18900, activeGigsCount: 0, completedGigsCount: 12, assignedManagersCount: 0, domain: 'UI/UX Design', createdAt: '2026-04-19' }
];

export const mockGigPros: GigProDetail[] = [
  { id: 'gig-01', name: 'Vikram Joshi', email: 'vikram.dev@gmail.com', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', isVerified: true, headline: 'Senior Full-Stack Architect (React 19 / Node / Go)', category: 'Software Development', hourlyRate: 95, rating: 4.95, reviewsCount: 68, totalEarnings: 84200, completedProjectsCount: 38, badge: 'TOP_RATED', skills: ['React', 'TypeScript', 'PostgreSQL', 'Docker', 'GraphQL'], createdAt: '2026-02-14' },
  { id: 'gig-02', name: 'Sarah Jenkins', email: 'sarah.designs@studio.io', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', isVerified: true, headline: 'Principal Product & Interaction Designer', category: 'Design & Creative', hourlyRate: 80, rating: 4.88, reviewsCount: 42, totalEarnings: 52000, completedProjectsCount: 29, badge: 'VERIFIED_PRO', skills: ['Figma', 'Design Systems', 'Prototyping', 'User Testing'], createdAt: '2026-03-01' },
  { id: 'gig-03', name: 'Mateo Rossi', email: 'mateo@3dworld.it', role: 'GIG_PROFESSIONAL', status: 'ACTIVE', isVerified: false, headline: '3D Modeler & WebGL Visualizer', category: '3D & Spatial', hourlyRate: 65, rating: 4.70, reviewsCount: 14, totalEarnings: 16400, completedProjectsCount: 9, badge: 'STANDARD', skills: ['Blender', 'Three.js', 'ShaderLab', 'Substance'], createdAt: '2026-06-20' },
  { id: 'gig-04', name: 'Kavita Rao', email: 'kavita.ai@datasci.org', role: 'GIG_PROFESSIONAL', status: 'PENDING_KYC', isVerified: false, headline: 'ML Engineer & Computer Vision Specialist', category: 'AI & Data Science', hourlyRate: 110, rating: 5.0, reviewsCount: 3, totalEarnings: 8200, completedProjectsCount: 3, badge: 'NONE', skills: ['PyTorch', 'YOLOv10', 'FastAPI', 'MLOps'], createdAt: '2026-08-02' }
];

export const mockManagers: ManagerDetail[] = [
  { id: 'mgr-01', name: 'David Vance', email: 'david@prismaventures.io', role: 'MANAGER', status: 'ACTIVE', isVerified: true, linkedClientId: 'cli-02', linkedClientName: 'Prisma Ventures', supervisedTasksCount: 4, department: 'Platform Engineering', createdAt: '2026-02-10' },
  { id: 'mgr-02', name: 'Chloe Dubois', email: 'chloe@kineticmedia.com', role: 'MANAGER', status: 'ACTIVE', isVerified: true, linkedClientId: 'cli-01', linkedClientName: 'Kinetic Media', supervisedTasksCount: 2, department: 'Video Production', createdAt: '2026-03-25' }
];

export const mockProjects: PlatformProject[] = [
  { id: 'prj-101', title: 'React 19 Migration & Design System Overhaul', clientId: 'cli-02', clientName: 'Prisma Ventures', gigProId: 'gig-01', gigProName: 'Vikram Joshi', budget: 8500, category: 'Software Development', status: 'IN_PROGRESS', dueDate: '2026-09-15', createdAt: '2026-08-10', milestonesCount: 3, deliverablesSubmitted: 2 },
  { id: 'prj-102', title: 'Interactive WebGL 3D Product Configurator', clientId: 'cli-01', clientName: 'Kinetic Media', gigProId: 'gig-03', gigProName: 'Mateo Rossi', budget: 4200, category: '3D & Spatial', status: 'REVIEWING', dueDate: '2026-08-28', createdAt: '2026-08-01', milestonesCount: 2, deliverablesSubmitted: 2 },
  { id: 'prj-103', title: 'Healthcare Patient Portal Mobile UI Kit', clientId: 'cli-04', clientName: 'Vivid Creative', gigProId: 'gig-02', gigProName: 'Sarah Jenkins', budget: 3600, category: 'Design & Creative', status: 'COMPLETED', dueDate: '2026-07-30', createdAt: '2026-07-05', milestonesCount: 2, deliverablesSubmitted: 2 },
  { id: 'prj-104', title: 'Real-time Object Detection Pipeline', clientId: 'cli-03', clientName: 'Cyberdyne Systems', gigProId: 'gig-04', gigProName: 'Kavita Rao', budget: 6200, category: 'AI & Data Science', status: 'DISPUTED', dueDate: '2026-08-20', createdAt: '2026-07-28', milestonesCount: 2, deliverablesSubmitted: 1 }
];

export const mockPayments: PaymentLedgerItem[] = [
  { id: 'pay-901', taskId: 'prj-101', taskTitle: 'React 19 Migration & Design System Overhaul', clientName: 'Prisma Ventures', gigProName: 'Vikram Joshi', grossAmount: 8500, platformRake: 850, netPayout: 7650, escrowStatus: 'HELD_IN_ESCROW', createdAt: '2026-08-10 14:30' },
  { id: 'pay-902', taskId: 'prj-102', taskTitle: 'Interactive WebGL 3D Product Configurator', clientName: 'Kinetic Media', gigProName: 'Mateo Rossi', grossAmount: 4200, platformRake: 420, netPayout: 3780, escrowStatus: 'HELD_IN_ESCROW', createdAt: '2026-08-01 10:15' },
  { id: 'pay-903', taskId: 'prj-103', taskTitle: 'Healthcare Patient Portal Mobile UI Kit', clientName: 'Vivid Creative', gigProName: 'Sarah Jenkins', grossAmount: 3600, platformRake: 360, netPayout: 3240, escrowStatus: 'RELEASED', createdAt: '2026-07-30 18:00' },
  { id: 'pay-904', taskId: 'prj-104', taskTitle: 'Real-time Object Detection Pipeline', clientName: 'Cyberdyne Systems', gigProName: 'Kavita Rao', grossAmount: 6200, platformRake: 620, netPayout: 5580, escrowStatus: 'DISPUTED', createdAt: '2026-07-28 09:45' }
];

export const mockReviews: ModerationReview[] = [
  { id: 'rev-01', taskId: 'prj-103', taskTitle: 'Healthcare Patient Portal Mobile UI Kit', reviewerName: 'Zoe Thorne', reviewerRole: 'CLIENT', targetUserName: 'Sarah Jenkins', rating: 5, comment: 'Sarah delivered an immaculate design system and component kit ahead of schedule. Exceptional communication throughout!', flagCount: 0, status: 'APPROVED', createdAt: '2026-07-31 09:12' },
  { id: 'rev-02', taskId: 'prj-104', taskTitle: 'Real-time Object Detection Pipeline', reviewerName: 'Lucas Sterling', reviewerRole: 'CLIENT', targetUserName: 'Kavita Rao', rating: 1, comment: 'Horrible code quality. Did not meet latency specs. Demanding full refund immediately.', flagCount: 2, flagReason: 'Retaliatory / Disputed contract', status: 'FLAGGED', createdAt: '2026-08-22 14:50' }
];

export const mockDisputes: DisputeCase[] = [
  { id: 'dsp-501', taskId: 'prj-104', taskTitle: 'Real-time Object Detection Pipeline', filedByName: 'Lucas Sterling (Client)', filedByRole: 'CLIENT', againstName: 'Kavita Rao (Freelancer)', disputeAmount: 6200, reason: 'Deliverable Latency Mismatch & Incomplete Scope', description: 'The delivered model runs at 14 FPS instead of the agreed 60 FPS on edge Jetson hardware. Freelancer refused to optimize further.', evidenceUrls: ['https://benchmarks.internal/report-402.pdf', 'https://github.com/repo/pr/12'], status: 'OPEN', slaHoursLeft: 18, createdAt: '2026-08-22 11:30' },
  { id: 'dsp-502', taskId: 'prj-108', taskTitle: 'E-commerce Checkout Microservice', filedByName: 'Marcus Thorne (Freelancer)', filedByRole: 'GIG_PROFESSIONAL', againstName: 'Apex Retailers (Client)', disputeAmount: 3400, reason: 'Client Ghosting After Milestone Approval', description: 'Final deliverable was verified and approved by the project manager 14 days ago, but client has stalled escrow release.', evidenceUrls: ['https://jira.internal/ticket-998', 'https://chat.internal/export.txt'], status: 'UNDER_REVIEW', slaHoursLeft: 36, createdAt: '2026-08-20 16:45' }
];

export const mockAdminStaff: AdminStaff[] = [
  { id: 'adm-01', name: 'Chaitanya Anand', email: 'chaitanya.admin@gigsforgigs.internal', role: 'OWNER', permissions: ['*'], isTwoFactorEnabled: true, lastLogin: '2026-08-25 00:45', status: 'ACTIVE' },
  { id: 'adm-02', name: 'Harrison Blake', email: 'harrison.finance@gigsforgigs.internal', role: 'FINANCIAL_ADMIN', permissions: ['payments:read', 'payments:refund', 'payments:release', 'analytics:read'], isTwoFactorEnabled: true, lastLogin: '2026-08-24 18:20', status: 'ACTIVE' },
  { id: 'adm-03', name: 'Nadia Solis', email: 'nadia.support@gigsforgigs.internal', role: 'SUPPORT_ADMIN', permissions: ['disputes:read', 'disputes:resolve', 'reviews:moderate', 'users:read'], isTwoFactorEnabled: false, lastLogin: '2026-08-24 15:10', status: 'ACTIVE' },
  { id: 'adm-04', name: 'Devin Cole', email: 'devin.mod@gigsforgigs.internal', role: 'CONTENT_MODERATOR', permissions: ['reviews:moderate', 'users:verify_badge'], isTwoFactorEnabled: false, lastLogin: '2026-08-23 20:00', status: 'INVITED' }
];

export const mockAuditLogs: AuditLogEntry[] = [
  { id: 'log-01', adminName: 'Chaitanya Anand', adminEmail: 'chaitanya.admin@gigsforgigs.internal', action: 'INVITE_ADMIN_STAFF', targetType: 'ADMIN_INVITATION', targetId: 'adm-04', diffSummary: 'Invited Devin Cole as CONTENT_MODERATOR', ipAddress: '192.168.1.42', createdAt: '2026-08-24 23:10' },
  { id: 'log-02', adminName: 'Harrison Blake', adminEmail: 'harrison.finance@gigsforgigs.internal', action: 'RELEASE_ESCROW', targetType: 'PAYMENT', targetId: 'pay-903', diffSummary: 'Released $3,240.00 to Sarah Jenkins', ipAddress: '10.0.4.18', createdAt: '2026-08-24 18:25' },
  { id: 'log-03', adminName: 'Chaitanya Anand', adminEmail: 'chaitanya.admin@gigsforgigs.internal', action: 'SUSPEND_USER', targetType: 'USER', targetId: 'cli-04', diffSummary: 'Suspended Zoe Thorne (TOS Violation - Non-payment)', ipAddress: '192.168.1.42', createdAt: '2026-08-24 16:30' }
];

export const mockPlatformConfig: PlatformConfig = {
  platformRakePercentage: 10,
  minimumGigBudget: 50,
  escrowHoldingDays: 14,
  isMaintenanceMode: false,
  allowedCategories: [
    'Software Development',
    'Design & Creative',
    'AI & Data Science',
    'Writing & Translation',
    '3D & Spatial',
    'Marketing & Growth'
  ],
  maxFileUploadMb: 100
};
