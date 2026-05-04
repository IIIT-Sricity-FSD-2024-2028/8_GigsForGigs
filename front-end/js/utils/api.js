// ─── api.js ─────────────────────────────────────────────────────
// Central API helper for making authenticated fetch() calls
// to the NestJS backend.  Sends x-user-id from the session.
// Falls back gracefully if the backend is unavailable.
// ─────────────────────────────────────────────────────────────────

import { getUser } from './storage.js';

export const API_BASE = 'http://localhost:3000';

/**
 * Authenticated fetch wrapper.
 * - Injects `x-user-id` header from the current session.
 * - Adds `Content-Type: application/json` for non-GET requests.
 * - Handles error responses with appropriate actions.
 * - Falls back to `null` if the backend is unreachable.
 *
 * @param {string} path  – API path (e.g. '/gig/profile')
 * @param {object} [options] – fetch options override
 * @returns {Promise<{ok: boolean, status: number, data: any} | null>}
 */
export async function apiFetch(path, options = {}) {
  const user = getUser();
  const url = `${API_BASE}${path}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Inject user id for auth
  if (user && user.id) {
    headers['x-user-id'] = user.id;
  }

  // Set content type for requests with a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
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

    // Handle common error codes
    if (response.status === 401) {
      console.warn('[API] 401 Unauthorized – session may have expired.');
    }

    if (response.status === 403) {
      console.warn('[API] 403 Forbidden –', data?.message || 'access denied.');
    }

    if (response.status === 409) {
      console.warn('[API] 409 Conflict –', data?.message || 'duplicate entry.');
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    // Backend unreachable — fall back silently
    console.warn('[API] Backend unreachable:', error.message || error);
    return null;
  }
}

/**
 * Convenience: GET request.
 */
export function apiGet(path) {
  return apiFetch(path, { method: 'GET' });
}

/**
 * Convenience: POST request with JSON body.
 */
export function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Convenience: PUT request with JSON body.
 */
export function apiPut(path, body) {
  return apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Convenience: DELETE request.
 */
export function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}
