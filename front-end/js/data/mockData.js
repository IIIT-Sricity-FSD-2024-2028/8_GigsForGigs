// ─── mockData.js ────────────────────────────────────────────────
// Seed arrays for GigsForGigs.  Every module imports these and
// mutates them in‑place — no backend, no fetch, no JSON files.
// ─────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'gfg_';
const USERS_STORAGE_KEY = `${STORAGE_PREFIX}users`;
const APPLICATIONS_STORAGE_KEY = 'gfg_persisted_applications';
const TASKS_STORAGE_KEY = 'gfg_tasks';
const SERVICES_STORAGE_KEY = 'gfg_services';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeUserRecord(user) {
  if (!user || typeof user !== 'object') return null;
  if (!user.id || !user.email || !user.role) return null;
  return user;
}

function mergeSeedUsersWithStored(seedUsers, storedUsers) {
  if (!Array.isArray(storedUsers) || storedUsers.length === 0) {
    return deepClone(seedUsers);
  }

  const mergedById = new Map();

  seedUsers.forEach((seedUser) => {
    mergedById.set(seedUser.id, deepClone(seedUser));
  });

  storedUsers.forEach((storedUser) => {
    const safeUser = normalizeUserRecord(storedUser);
    if (!safeUser) return;

    const existing = mergedById.get(safeUser.id);
    if (existing) {
      // Keep persisted profile fields but preserve seeded login identity.
      mergedById.set(safeUser.id, {
        ...existing,
        ...safeUser,
        email: existing.email,
        password: existing.password,
        role: existing.role
      });
      return;
    }

    mergedById.set(safeUser.id, deepClone(safeUser));
  });

  return [...mergedById.values()];
}

function loadUsersFromStorage(seedUsers) {
  try {
    if (typeof localStorage === 'undefined') {
      return deepClone(seedUsers);
    }

    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return deepClone(seedUsers);

    const parsed = JSON.parse(raw);
    return mergeSeedUsersWithStored(seedUsers, parsed);
  } catch {
    return deepClone(seedUsers);
  }
}

export function saveUsers() {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

function readLocalArray(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalArray(key, value) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in private mode/quota exceeded.
  }
}

function initializeLocalArray(key, seededValue) {
  if (typeof localStorage === 'undefined') return deepClone(seededValue);

  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      return Array.isArray(parsed) ? parsed : deepClone(seededValue);
    }

    const snapshot = deepClone(seededValue);
    writeLocalArray(key, snapshot);
    return snapshot;
  } catch {
    return deepClone(seededValue);
  }
}
// ── Users ────────────────────────────────────────────────────────
const seedUsers = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@acmecorp.com',
    password: 'password1',
    role: 'client',
    isFirstTimeUser: false,
    company: 'Acme Corp',
    industry: 'tech',
    website: 'https://acmecorp.com',
    companySize: '11-50',
    founded: 2018,
    description: 'Leading technology solutions provider specializing in SaaS products.',
    createdAt: '2024-01-15T10:00:00Z',
    isProfileComplete: true,
    tasksPosted: 6,
    activeProjects: 2,
    totalSpent: 4500
  },
  {
    id: 'u2',
    name: 'Alex Rivera',
    email: 'rivera@acmecorp.com',
    password: 'password2',
    role: 'manager',
    isFirstTimeUser: false,
    clientId: 'u1',               // linked to the root client
    createdAt: '2024-03-10T09:00:00Z',
    isProfileComplete: true,
    tasksManaged: 6
  },
  {
    id: 'u3',
    name: 'John Doe',
    email: 'john@gigpro.com',
    password: 'password3',
    role: 'gig',
    isFirstTimeUser: false,
    title: 'Senior Full-Stack Developer & UI/UX Expert',
    experience: 'senior',
    skills: ['React.js', 'Node.js', 'UI/UX Design', 'Figma', 'TypeScript', 'CSS Architecture', 'PostgreSQL'],
    bio: 'I am a passionate software developer with over 8 years of experience building scalable web applications and engaging user interfaces. I specialize in the React ecosystem, Node.js, and modern CSS frameworks.',
    portfolio: 'https://johndoe.dev',
    hourlyRate: 55,
    availability: 'full-time',
    location: 'New York, USA',
    createdAt: '2024-02-20T14:00:00Z',
    isProfileComplete: true,
    completedTasks: 12,
    totalEarnings: 15840,
    avgRating: 4.8,
    totalRatings: 24,
    profileViews: 1250
  },
  {
    id: 'u4',
    name: 'Sarah Chen',
    email: 'sarah@gigpro.com',
    password: 'password4',
    role: 'gig',
    isFirstTimeUser: false,
    title: 'Frontend Engineer & UI Specialist',
    experience: 'mid',
    skills: ['React', 'Vue.js', 'CSS', 'Accessibility', 'Wireframing'],
    bio: 'Bridging the gap between beautiful design and robust code with responsive, accessible frontends.',
    portfolio: 'https://sarahchen.design',
    hourlyRate: 45,
    availability: 'part-time',
    location: 'San Francisco, USA',
    createdAt: '2024-04-05T11:00:00Z',
    isProfileComplete: true,
    completedTasks: 8,
    totalEarnings: 7200,
    avgRating: 4.6,
    totalRatings: 18,
    profileViews: 680
  },
  {
    id: 'u5',
    name: 'New First Time User',
    email: 'newuser@example.com',
    password: 'password5',
    role: 'gig',
    isFirstTimeUser: true,
    title: null,
    experience: null,
    skills: [],
    bio: null,
    portfolio: null,
    hourlyRate: 0,
    availability: null,
    location: null,
    createdAt: '2024-10-22T10:00:00Z',
    isProfileComplete: false,
    completedTasks: 0,
    totalEarnings: 0,
    avgRating: 0,
    totalRatings: 0,
    profileViews: 0
  },
  {
    id: 'u6',
    name: 'Emma Wilson',
    email: 'emma@newstartup.com',
    password: 'password6',
    role: 'client',
    isFirstTimeUser: true,
    company: null,
    industry: null,
    website: null,
    companySize: null,
    founded: null,
    description: null,
    createdAt: '2024-10-23T14:30:00Z',
    isProfileComplete: false,
    tasksPosted: 0,
    activeProjects: 0,
    totalSpent: 0
  },
  {
    id: 'u7',
    name: 'Nisha Verma',
    email: 'nisha@freshclient.com',
    password: 'password7',
    role: 'client',
    isFirstTimeUser: true,
    company: null,
    industry: null,
    website: null,
    companySize: null,
    founded: null,
    description: null,
    createdAt: '2026-04-01T09:00:00Z',
    isProfileComplete: false,
    tasksPosted: 0,
    activeProjects: 0,
    totalSpent: 0
  }
];

export const users = loadUsersFromStorage(seedUsers);

// ── Tasks ────────────────────────────────────────────────────────
// Statuses: open | in_progress | under_review | completed
const seededTasks = [
  {
    id: 't1',
    clientId: 'u1',
    title: 'Logo Design for Startup',
    category: 'design',
    duration: 'one-time',
    description: 'We are looking for a modern, minimalist logo design for our new sustainable packaging startup, EcoPack. The logo needs to communicate environmental responsibility while looking premium.',
    pricing: 'fixed',
    budget: 450,
    skills: ['Logo Design', 'Brand Identity', 'Adobe Illustrator'],
    status: 'open',
    assignedTo: null,
    deadline: '2025-11-15T00:00:00Z',
    createdAt: '2024-10-01T09:00:00Z'
  },
  {
    id: 't2',
    clientId: 'u1',
    title: 'React Dashboard UI',
    category: 'dev',
    duration: '1-3-months',
    description: 'Need an experienced React developer to build a modern admin dashboard with data visualizations, real-time updates, and responsive design.',
    pricing: 'fixed',
    budget: 1200,
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    status: 'in_progress',
    assignedTo: 'u3',
    deadline: '2025-11-05T00:00:00Z',
    createdAt: '2024-09-15T12:00:00Z'
  },
  {
    id: 't3',
    clientId: 'u1',
    title: 'UX Audit for Mobile App',
    category: 'design',
    duration: 'less-month',
    description: 'Comprehensive UX audit of our mobile application including user flow analysis, heuristic evaluation, and actionable improvement recommendations.',
    pricing: 'fixed',
    budget: 1200,
    skills: ['UX Research', 'Wireframing', 'Figma'],
    status: 'under_review',
    assignedTo: 'u4',
    deadline: '2024-10-24T00:00:00Z',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 't4',
    clientId: 'u1',
    title: 'Weekly SEO Audit',
    category: 'marketing',
    duration: 'ongoing',
    description: 'Perform weekly SEO audits covering keyword performance, backlink health, and technical SEO improvements for our corporate website.',
    pricing: 'fixed',
    budget: 800,
    skills: ['SEO', 'Google Analytics', 'Content Strategy'],
    status: 'completed',
    assignedTo: 'u3',
    deadline: '2024-10-10T00:00:00Z',
    createdAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 't5',
    clientId: 'u1',
    title: 'E-commerce Packaging Design',
    category: 'design',
    duration: 'one-time',
    description: 'Design premium packaging for an e-commerce gifting brand. Must include box design, tissue paper pattern, and branded sticker.',
    pricing: 'fixed',
    budget: 850,
    skills: ['Packaging Design', 'Print Design', 'Adobe InDesign'],
    status: 'open',
    assignedTo: null,
    deadline: '2025-12-01T00:00:00Z',
    createdAt: '2024-10-05T14:00:00Z'
  },
  {
    id: 't6',
    clientId: 'u1',
    title: 'SEO Optimization Strategy',
    category: 'marketing',
    duration: '1-3-months',
    description: 'Develop and execute a comprehensive SEO strategy including keyword research, on-page optimization, and link building.',
    pricing: 'fixed',
    budget: 600,
    skills: ['SEO', 'Content Marketing', 'Analytics'],
    status: 'open',
    assignedTo: null,
    deadline: '2025-12-15T00:00:00Z',
    createdAt: '2024-10-08T11:00:00Z'
  }
];

export const tasks = initializeLocalArray(TASKS_STORAGE_KEY, seededTasks);

export function saveTasks() {
  writeLocalArray(TASKS_STORAGE_KEY, tasks);
}

// ── Applications ─────────────────────────────────────────────────
// An application is a gig professional applying to an open task
// status: pending | shortlisted | rejected
const seededApplications = [
  {
    id: 'a1',
    taskId: 't1',
    gigId: 'u3',
    coverLetter: 'I have extensive experience in brand identity design and would love to work on this project. I can deliver 3 initial concepts within the first week.',
    proposedBudget: 450,
    status: 'pending',
    createdAt: '2024-10-03T10:00:00Z'
  },
  {
    id: 'a2',
    taskId: 't1',
    gigId: 'u4',
    coverLetter: 'As a UI specialist with a strong eye for branding, I can create a cohesive logo that aligns with your sustainability mission.',
    proposedBudget: 400,
    status: 'shortlisted',
    createdAt: '2024-10-04T09:00:00Z'
  },
  {
    id: 'a3',
    taskId: 't5',
    gigId: 'u3',
    coverLetter: 'I have worked on several e-commerce packaging projects and can deliver high-quality print-ready files.',
    proposedBudget: 850,
    status: 'pending',
    createdAt: '2024-10-07T15:00:00Z'
  }
];

export const applications = readLocalArray(APPLICATIONS_STORAGE_KEY, seededApplications);

export function persistApplications() {
  writeLocalArray(APPLICATIONS_STORAGE_KEY, applications);
}

// ── Deliverables ─────────────────────────────────────────────────
// status: submitted | approved | revision_requested
export const deliverables = [
  {
    id: 'd1',
    taskId: 't3',
    gigId: 'u4',
    title: 'UX Audit Report - Final',
    description: 'Complete UX audit report with heuristic evaluation, user flow diagrams, and prioritized recommendations.',
    files: ['UX_Audit_Report_v2.pdf', 'User_Flow_Diagrams.zip'],
    message: 'Hi Team! I have attached the final UX audit report along with updated user flow diagrams. All feedback from the previous round has been incorporated.',
    status: 'submitted',
    submittedAt: '2024-10-20T10:45:00Z'
  },
  {
    id: 'd2',
    taskId: 't4',
    gigId: 'u3',
    title: 'Weekly SEO Audit - Final Report',
    description: 'Comprehensive SEO audit covering keyword rankings, backlink profile, and technical improvements.',
    files: ['SEO_Audit_Final.pdf', 'Keyword_Report.xlsx'],
    message: 'All SEO audit deliverables are complete. The keyword rankings have improved by 15% over the engagement period.',
    status: 'approved',
    submittedAt: '2024-10-08T16:00:00Z',
    approvedAt: '2024-10-09T09:00:00Z',
    paymentReleased: true
  },
  {
    id: 'd3',
    taskId: 't2',
    gigId: 'u3',
    title: 'React Dashboard - Phase 1',
    description: 'Phase 1 of the dashboard build including authentication, layout, and core data visualisation components.',
    files: ['Dashboard_Phase1_Preview.pdf'],
    message: 'Phase 1 is ready for review. Core layout, auth flow, and chart components are complete.',
    status: 'revision_requested',
    submittedAt: '2024-10-15T14:00:00Z',
    revisionNote: 'Please update the colour palette to match the new brand guidelines we shared last week.'
  }
];

// ── Services (posted by gig professionals) ───────────────────────
const seededServices = [
  {
    id: 's1',
    gigId: 'u3',
    title: 'Modern React Web App Development',
    description: 'Custom SPA build from scratch including routing and state management.',
    category: 'dev',
    startingPrice: 1200,
    createdAt: '2024-06-01T08:00:00Z'
  },
  {
    id: 's2',
    gigId: 'u3',
    title: 'Logo & Brand Identity Design',
    description: 'Complete brand stylesheet, vector logos, and social media assets.',
    category: 'design',
    startingPrice: 450,
    createdAt: '2024-07-15T10:00:00Z'
  },
  {
    id: 's3',
    gigId: 'u4',
    title: 'Responsive Frontend Development',
    description: 'Pixel-perfect, accessible frontend builds from Figma or Sketch designs.',
    category: 'dev',
    startingPrice: 800,
    createdAt: '2024-08-20T12:00:00Z'
  }
];

export const services = initializeLocalArray(SERVICES_STORAGE_KEY, seededServices);

export function saveServices() {
  writeLocalArray(SERVICES_STORAGE_KEY, services);
}
