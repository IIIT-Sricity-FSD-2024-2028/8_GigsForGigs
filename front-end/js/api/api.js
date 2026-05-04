// ─── api.js ─────────────────────────────────────────────────────
// Central API helper for /api endpoints (no client-side persistence).
// ─────────────────────────────────────────────────────────────────

import { getUser } from '../utils/storage.js';

export const BASE_URL = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const user = getUser();
  const headers = {
    ...(options.headers || {})
  };

  if (user?.id) {
    headers['x-user-id'] = user.id;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        error: data?.message || response.statusText || 'Request failed'
      };
    }

    return {
      ok: true,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error?.message || 'Network error'
    };
  }
}

export function apiGet(path) {
  return request(path, { method: 'GET' });
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function apiPut(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}
