// ─── adminData.js ───────────────────────────────────────────────
// API client for the Super Admin panel.
// All data flows through the NestJS backend at /admin/*.
// ─────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3000/admin';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);

  // DELETE returns 204 No Content
  if (res.status === 204) return null;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || `Request failed: ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────────

export function fetchDashboardStats() {
  return request('/dashboard/stats');
}

// ── Users ────────────────────────────────────────────────────────

export function fetchUsers() { return request('/users'); }
export function fetchUser(id) { return request(`/users/${id}`); }
export function createUser(data) {
  return request('/users', { method: 'POST', body: JSON.stringify(data) });
}
export function updateUser(id, data) {
  return request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deleteUser(id) {
  return request(`/users/${id}`, { method: 'DELETE' });
}

// ── Clients ──────────────────────────────────────────────────────

export function fetchClients() { return request('/clients'); }
export function createClient(data) {
  return request('/clients', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteClient(id) {
  return request(`/clients/${id}`, { method: 'DELETE' });
}

// ── Managers ─────────────────────────────────────────────────────

export function fetchManagers() { return request('/managers'); }
export function createManager(data) {
  return request('/managers', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteManager(clientId, managerId) {
  return request(`/managers/${clientId}/${managerId}`, { method: 'DELETE' });
}

// ── Gig Profiles ─────────────────────────────────────────────────

export function fetchGigProfiles() { return request('/gig-profiles'); }
export function createGigProfile(data) {
  return request('/gig-profiles', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteGigProfile(id) {
  return request(`/gig-profiles/${id}`, { method: 'DELETE' });
}

// ── Tasks ────────────────────────────────────────────────────────

export function fetchTasks() { return request('/tasks'); }
export function fetchTask(id) { return request(`/tasks/${id}`); }
export function createTask(data) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(data) });
}
export function updateTask(id, data) {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

// ── Applications ─────────────────────────────────────────────────

export function fetchApplications() { return request('/applications'); }
export function createApplication(data) {
  return request('/applications', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteApplication(id) {
  return request(`/applications/${id}`, { method: 'DELETE' });
}

// ── Assignments ──────────────────────────────────────────────────

export function fetchAssignments() { return request('/assignments'); }
export function createAssignment(data) {
  return request('/assignments', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteAssignment(gigProfileId, taskId) {
  return request(`/assignments/${gigProfileId}/${taskId}`, { method: 'DELETE' });
}

// ── Deliverables ─────────────────────────────────────────────────

export function fetchDeliverables() { return request('/deliverables'); }
export function createDeliverable(data) {
  return request('/deliverables', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteDeliverable(taskId, deliverableNo) {
  return request(`/deliverables/${taskId}/${deliverableNo}`, { method: 'DELETE' });
}

// ── Payments ─────────────────────────────────────────────────────

export function fetchPayments() { return request('/payments'); }
export function createPayment(data) {
  return request('/payments', { method: 'POST', body: JSON.stringify(data) });
}
export function deletePayment(id) {
  return request(`/payments/${id}`, { method: 'DELETE' });
}

// ── Reviews ──────────────────────────────────────────────────────

export function fetchReviews() { return request('/reviews'); }
export function createReview(data) {
  return request('/reviews', { method: 'POST', body: JSON.stringify(data) });
}
export function deleteReview(id) {
  return request(`/reviews/${id}`, { method: 'DELETE' });
}
