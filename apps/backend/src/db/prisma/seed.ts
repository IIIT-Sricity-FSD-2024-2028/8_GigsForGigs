/**
 * @file seed.ts
 * @description
 * Enterprise database seeder for GigsForGigs.
 * Populates complete relational entities (Users, Profiles, Tasks, Milestones,
 * Deliverables, Escrow Payments, Reviews, Disputes, Invitations, and Audit Logs).
 */

export const mockDatabaseSeed = {
  users: [
    { userId: 1, name: 'Chaitanya Anand', email: 'chaitanya.admin@gigsforgigs.internal', role: 'super_admin', hashPassword: 'argon2:$hashed-password' },
    { userId: 2, name: 'Sarah Finance', email: 'sarah.finance@gigsforgigs.internal', role: 'super_admin', hashPassword: 'argon2:$hashed-password' },
    { userId: 3, name: 'Alex Support', email: 'alex.support@gigsforgigs.internal', role: 'super_admin', hashPassword: 'argon2:$hashed-password' },
    { userId: 4, name: 'Leo Hudson', email: 'leo.hudson@techstart.io', role: 'manager', hashPassword: 'argon2:$hashed-password' },
    { userId: 5, name: 'Marcus Vance', email: 'marcus.vance@nexus.com', role: 'manager', hashPassword: 'argon2:$hashed-password' },
    { userId: 6, name: 'Aditya Deshmukh', email: 'aditya@gigsforgigs.com', role: 'client', hashPassword: 'argon2:$hashed-password' },
    { userId: 7, name: 'Apex Studios Inc.', email: 'billing@apexstudios.com', role: 'client', hashPassword: 'argon2:$hashed-password' },
    { userId: 8, name: 'Elena Rodriguez', email: 'elena.rodriguez@freelance.dev', role: 'gig_professional', hashPassword: 'argon2:$hashed-password' },
    { userId: 9, name: 'Marcus Chen', email: 'marcus.chen@designcraft.io', role: 'gig_professional', hashPassword: 'argon2:$hashed-password' },
    { userId: 10, name: 'Sarah Jenkins', email: 'sarah.j@aisolutions.ai', role: 'gig_professional', hashPassword: 'argon2:$hashed-password' }
  ],
  clients: [
    { clientId: 1, userId: 6, clientName: 'TechStart Labs', domain: 'FinTech & AI Platforms', numberOfManager: 2 },
    { clientId: 2, userId: 7, clientName: 'Apex Creative Studios', domain: 'Spatial Media & 3D Web', numberOfManager: 1 }
  ],
  managers: [
    { clientId: 1, managerId: 101, userId: 4 },
    { clientId: 2, managerId: 102, userId: 5 }
  ],
  gigProfiles: [
    { gigProfileId: 201, userId: 8, bio: 'Senior Full-Stack TypeScript & Cloud Architect. 8+ years building enterprise SaaS.' },
    { gigProfileId: 202, userId: 9, bio: 'Lead Product & 3D Spatial Designer. Ex-Figma community contributor.' },
    { gigProfileId: 203, userId: 10, bio: 'Computer Vision & Deep Learning Specialist. PyTorch & WebAssembly edge AI.' }
  ],
  skills: [
    { gigProfileId: 201, skill: 'React 19' },
    { gigProfileId: 201, skill: 'TypeScript' },
    { gigProfileId: 201, skill: 'Node.js' },
    { gigProfileId: 201, skill: 'PostgreSQL' },
    { gigProfileId: 202, skill: 'UI/UX Design' },
    { gigProfileId: 202, skill: 'Three.js' },
    { gigProfileId: 202, skill: 'Figma' },
    { gigProfileId: 203, skill: 'PyTorch' },
    { gigProfileId: 203, skill: 'FastAPI' },
    { gigProfileId: 203, skill: 'Computer Vision' }
  ],
  tasks: [
    {
      taskId: 301,
      clientId: 1,
      title: 'Enterprise RBAC Authentication & Session Engine',
      description: 'Implement hybrid tokenVersion session invalidation, Argon2 password hashing, and role bitmasks.',
      budget: 3500.0,
      status: 'in_progress',
      dueDate: '2026-09-15'
    },
    {
      taskId: 302,
      clientId: 1,
      title: 'Real-Time Financial Escrow Ledger & Webhooks',
      description: 'Stripe webhook listener, atomic escrow balance transitions, and double-entry bookkeeping ledger.',
      budget: 4800.0,
      status: 'in_progress',
      dueDate: '2026-09-20'
    },
    {
      taskId: 303,
      clientId: 2,
      title: 'Spatial WebGL 3D Product Configurator',
      description: 'Interactive Three.js canvas with GLTF loading, environment PBR lighting, and mobile AR view.',
      budget: 5200.0,
      status: 'open',
      dueDate: '2026-10-01'
    }
  ],
  deliverables: [
    {
      taskId: 301,
      deliverableNo: 1,
      gigProfileId: 201,
      description: 'Milestone 1: Express authentication router, JWT middleware, and Argon2 password tests.',
      submissionPath: 'https://s3.amazonaws.com/gfg-artifacts/task-301-m1.zip',
      status: 'approved'
    },
    {
      taskId: 301,
      deliverableNo: 2,
      gigProfileId: 201,
      description: 'Milestone 2: Hybrid tokenVersion session invalidation and unit test suite.',
      submissionPath: 'https://s3.amazonaws.com/gfg-artifacts/task-301-m2.zip',
      status: 'submitted'
    }
  ],
  payments: [
    { paymentId: 401, taskId: 301, gigProfileId: 201, amount: 1750.0, status: 'completed' },
    { paymentId: 402, taskId: 301, gigProfileId: 201, amount: 1750.0, status: 'pending' },
    { paymentId: 403, taskId: 302, gigProfileId: 201, amount: 4800.0, status: 'pending' }
  ],
  reviews: [
    { reviewId: 501, reviewerId: 6, revieweeId: 8, taskId: 301, rating: 5, comment: 'Outstanding engineering quality and fast turnaround!' },
    { reviewId: 502, reviewerId: 7, revieweeId: 9, taskId: 303, rating: 5, comment: 'Flawless 3D execution and beautiful visual shaders.' }
  ]
};

console.log('🌱 GigsForGigs Database Seed Definition Loaded.');
