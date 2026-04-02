// ─── adminData.js ───────────────────────────────────────────────
// Self-contained data layer for the Super Admin dashboard.
// Persists to localStorage with gfg_admin_ prefix.
// Reads (but never writes to) existing platform keys.
// ─────────────────────────────────────────────────────────────────

const PREFIX = 'gfg_admin_';

// ── localStorage helpers ─────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
  } catch { return JSON.parse(JSON.stringify(fallback)); }
}

function save(key, data) {
  try { localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data)); } catch {}
}

// Read platform data set by the main app (read-only)
function loadPlatform(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// ── ID generator ─────────────────────────────────────────────────

let _seq = Date.now();
export function adminId(prefix = 'adm') {
  return `${prefix}_${(++_seq).toString(36)}`;
}

// ── Seed Data ────────────────────────────────────────────────────

const SEED_ADMINS = [
  { id: 'sa_root', name: 'Alex Rivera', email: 'admin123@gmail.com', password: 'admin123', role: 'super_admin', status: 'active', avatar: 'https://i.pravatar.cc/150?u=alexr', createdAt: '2023-01-10T00:00:00Z' }
];

const SEED_CLIENTS = [
  { id: 'ac_1', name: 'Julianne Doe', email: 'j.doe@startup.com', company: 'Nexus Tech', accountType: 'Individual Account', jobsPosted: 12, status: 'active', joinDate: '2024-01-15', avatar: 'https://i.pravatar.cc/150?u=julianne' },
  { id: 'ac_2', name: 'Marcus Sterling', email: 'm.sterling@global.co', company: 'Global Logistics', accountType: 'Enterprise Account', jobsPosted: 45, status: 'suspended', joinDate: '2023-12-02', avatar: 'https://i.pravatar.cc/150?u=marcus_s' },
  { id: 'ac_3', name: 'Elena Rodriguez', email: 'elena.r@fintech.io', company: 'SwiftPay Fintech', accountType: 'Startup Tier', jobsPosted: 5, status: 'pending', joinDate: '2024-02-11', avatar: 'https://i.pravatar.cc/150?u=elena' },
  { id: 'ac_4', name: 'David Chen', email: 'd.chen@creative.agency', company: 'Lumina Agency', accountType: 'Partner Account', jobsPosted: 28, status: 'active', joinDate: '2023-11-28', avatar: 'https://i.pravatar.cc/150?u=david' }
];

const SEED_MANAGERS = [
  { id: 'am_1', name: 'Sarah Miller', email: 'sarah.m@nexus.io', clientCompany: 'Nexus Tech', assignedProjects: 8, status: 'active', joinDate: '2023-06-15', avatar: 'https://i.pravatar.cc/150?u=sarah_m' },
  { id: 'am_2', name: 'James Chen', email: 'james.c@global.co', clientCompany: 'Global Logistics', assignedProjects: 12, status: 'active', joinDate: '2023-03-20', avatar: 'https://i.pravatar.cc/150?u=james_c' },
  { id: 'am_3', name: 'Leo Hudson', email: 'leo.h@agency.co', clientCompany: 'Lumina Agency', assignedProjects: 5, status: 'suspended', joinDate: '2023-09-10', avatar: 'https://i.pravatar.cc/150?u=leo_h' }
];

const SEED_PROFESSIONALS = [
  { id: 'ap_1', name: 'Julianna Doe', email: 'julianna@pro.com', title: 'UX Consultant', skills: ['UI/UX', 'Figma', 'Research'], rating: 4.9, completedJobs: 34, status: 'verified', joinDate: '2023-04-12', avatar: 'https://i.pravatar.cc/150?u=julianna' },
  { id: 'ap_2', name: 'Marcus Thorne', email: 'marcus.t@pro.com', title: 'Full Stack Developer', skills: ['React', 'Node.js', 'AWS'], rating: 4.7, completedJobs: 52, status: 'verified', joinDate: '2023-02-08', avatar: 'https://i.pravatar.cc/150?u=marcus_v' },
  { id: 'ap_3', name: 'Elena Torres', email: 'elena.t@pro.com', title: 'Python Developer', skills: ['Python', 'Django', 'ML'], rating: 4.8, completedJobs: 19, status: 'pending', joinDate: '2024-01-20', avatar: 'https://i.pravatar.cc/150?u=elena_t' },
  { id: 'ap_4', name: 'Kevin Wu', email: 'kevin.w@pro.com', title: 'Photographer', skills: ['Photography', 'Editing', 'Branding'], rating: 4.5, completedJobs: 28, status: 'verified', joinDate: '2023-07-05', avatar: 'https://i.pravatar.cc/150?u=kevin_m' }
];

const SEED_PROJECTS = [
  { id: 'aprj_1', title: 'Brand Identity Redesign', client: 'Nexus Tech', manager: 'Sarah Miller', professional: 'Julianna Doe', budget: 2500, status: 'active', startDate: '2023-10-12' },
  { id: 'aprj_2', title: 'Mobile App Development', client: 'Global Logistics', manager: 'James Chen', professional: 'Marcus Thorne', budget: 12000, status: 'completed', startDate: '2023-08-05' },
  { id: 'aprj_3', title: 'SEO Strategy & Implementation', client: 'Apex Media', manager: 'Sarah Miller', professional: 'Elena Torres', budget: 4800, status: 'disputed', startDate: '2023-11-01' },
  { id: 'aprj_4', title: 'E-commerce Photography', client: 'Velvet Fashion', manager: 'James Chen', professional: 'Kevin Wu', budget: 1200, status: 'cancelled', startDate: '2023-09-20' }
];

const SEED_TRANSACTIONS = [
  { id: 'txn_1', txnId: 'TXN-88210', user: 'Sarah Jenkins', role: 'client', amount: 1250, fee: 187.50, date: '2023-10-24', status: 'paid', avatar: 'https://i.pravatar.cc/150?u=sarah_j' },
  { id: 'txn_2', txnId: 'TXN-88211', user: 'David Chen', role: 'gig', amount: 850, fee: 127.50, date: '2023-10-24', status: 'pending', avatar: 'https://i.pravatar.cc/150?u=david_ch' },
  { id: 'txn_3', txnId: 'TXN-88212', user: 'Lila Moore', role: 'client', amount: 420, fee: 63, date: '2023-10-23', status: 'refunded', avatar: 'https://i.pravatar.cc/150?u=lila_m' },
  { id: 'txn_4', txnId: 'TXN-88213', user: 'Robert Ford', role: 'gig', amount: 3100, fee: 465, date: '2023-10-23', status: 'paid', avatar: 'https://i.pravatar.cc/150?u=robert_f' }
];

const SEED_REVIEWS = [
  { id: 'rev_1', reviewer: 'Sarah Jenkins', subject: 'Marcus V.', role: 'gig', rating: 5.0, feedback: 'Absolutely professional and on time. Would hire again!', date: '2023-10-24', status: 'verified', avatarReviewer: 'https://i.pravatar.cc/150?u=sarah_j2', avatarSubject: 'https://i.pravatar.cc/150?u=marcus_v' },
  { id: 'rev_2', reviewer: 'Alex Thompson', subject: 'Elena G.', role: 'client', rating: 1.0, feedback: 'INAPPROPRIATE BEHAVIOR. Use extreme caution.', date: '2023-10-23', status: 'reported', avatarReviewer: 'https://i.pravatar.cc/150?u=alext2', avatarSubject: 'https://i.pravatar.cc/150?u=elena_g2' },
  { id: 'rev_3', reviewer: 'Jessica Wu', subject: 'David K.', role: 'gig', rating: 4.0, feedback: 'Great work overall, but communication could improve.', date: '2023-10-22', status: 'pending', avatarReviewer: 'https://i.pravatar.cc/150?u=jessica_w', avatarSubject: 'https://i.pravatar.cc/150?u=david_k2' },
  { id: 'rev_4', reviewer: 'Kevin Miller', subject: 'Rachel S.', role: 'client', rating: 5.0, feedback: 'Unbelievable quality of work. Highly recommended!', date: '2023-10-21', status: 'verified', avatarReviewer: 'https://i.pravatar.cc/150?u=kevin_m', avatarSubject: 'https://i.pravatar.cc/150?u=rachel_s' }
];

const SEED_REPORTS = [
  { id: 'rpt_1', type: 'Payment Dispute', reporter: 'Elena Vance', against: 'Marcus Thorne', description: 'Work not delivered as per scope.', severity: 'high', status: 'open', createdAt: '2023-10-24' },
  { id: 'rpt_2', type: 'User Report', reporter: 'David Chen', against: 'Alex Thompson', description: 'Inappropriate behaviour during project.', severity: 'critical', status: 'investigating', createdAt: '2023-10-23' },
  { id: 'rpt_3', type: 'Quality Complaint', reporter: 'Lila Moore', against: 'Kevin Wu', description: 'Deliverables do not match agreed specification.', severity: 'medium', status: 'resolved', createdAt: '2023-10-20' }
];

const SEED_CATEGORIES = [
  { id: 'cat_1', name: 'Web Development', count: 1240 },
  { id: 'cat_2', name: 'UI/UX Design', count: 890 },
  { id: 'cat_3', name: 'Mobile Development', count: 654 },
  { id: 'cat_4', name: 'Data Science', count: 420 },
  { id: 'cat_5', name: 'DevOps', count: 312 },
  { id: 'cat_6', name: 'Photography', count: 278 }
];

// ── Hydrate from localStorage or fall back to seeds ─────────────

export const adminUsers     = load('admins', SEED_ADMINS);
export const adminClients   = load('clients', SEED_CLIENTS);
export const adminManagers  = load('managers', SEED_MANAGERS);
export const adminProfessionals = load('professionals', SEED_PROFESSIONALS);
export const adminProjects  = load('projects', SEED_PROJECTS);
export const adminTransactions = load('transactions', SEED_TRANSACTIONS);
export const adminReviews   = load('reviews', SEED_REVIEWS);
export const adminReports   = load('reports', SEED_REPORTS);
export const adminCategories = load('categories', SEED_CATEGORIES);

// ── Persist helpers ──────────────────────────────────────────────

export function saveAdmins()        { save('admins', adminUsers); }
export function saveClients()       { save('clients', adminClients); }
export function saveManagers()      { save('managers', adminManagers); }
export function saveProfessionals() { save('professionals', adminProfessionals); }
export function saveProjects()      { save('projects', adminProjects); }
export function saveTransactions()  { save('transactions', adminTransactions); }
export function saveReviews()       { save('reviews', adminReviews); }
export function saveReports()       { save('reports', adminReports); }
export function saveCategories()    { save('categories', adminCategories); }

// ── Generic CRUD ─────────────────────────────────────────────────

export function findById(arr, id) {
  return arr.find(item => item.id === id) || null;
}

export function removeById(arr, id) {
  const idx = arr.findIndex(item => item.id === id);
  if (idx !== -1) arr.splice(idx, 1);
  return idx !== -1;
}

export function toggleStatus(item) {
  if (item.status === 'active' || item.status === 'verified') {
    item.status = 'suspended';
  } else {
    item.status = 'active';
  }
  return item;
}

// ── Platform data (read-only) ────────────────────────────────────

export function getPlatformUsers() { return loadPlatform('gfg_users', []); }
export function getPlatformTasks() { return loadPlatform('gfg_tasks', []); }

// ── CSV Export ────────────────────────────────────────────────────

export function exportCSV(headers, rows, filename) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(row.map(escape).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Formatting helpers ───────────────────────────────────────────

export function fmtCurrency(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  return `${parts[0][0]}${(parts[parts.length - 1] || '')[0] || ''}`.toUpperCase();
}
