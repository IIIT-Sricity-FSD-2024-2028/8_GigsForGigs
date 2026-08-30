/**
 * @file httpClient.ts
 * @description
 * Single shared fetch wrapper for every `services/api/<role>/*Api.ts` module.
 * Attaches the right actor's bearer token, parses JSON consistently, and
 * throws a typed ApiError on any non-2xx response (including network
 * failures, which surface as a status: 0 ApiError) so callers can branch on
 * `err.status` instead of re-implementing fetch/try-catch per file.
 */

export const API_BASE_URL = 'http://localhost:5000/api';

/** One localStorage key per actor — a browser tab can hold a client, manager,
 * and gig session at once since each role logs in through a separate flow. */
export type ActorRole = 'client' | 'manager' | 'gig_professional' | 'admin';

const TOKEN_KEYS: Record<ActorRole, string> = {
  client: 'g4g_client_token',
  manager: 'g4g_manager_token',
  gig_professional: 'g4g_gig_token',
  admin: 'g4g_admin_token',
};

export function getToken(actor: ActorRole): string | null {
  return localStorage.getItem(TOKEN_KEYS[actor]);
}

export function setToken(actor: ActorRole, token: string): void {
  localStorage.setItem(TOKEN_KEYS[actor], token);
}

export function clearToken(actor: ActorRole): void {
  localStorage.removeItem(TOKEN_KEYS[actor]);
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;
  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/** Fired whenever a request for `actor` comes back 401 so AuthContext can log that actor out. */
export const UNAUTHORIZED_EVENT = 'g4g:unauthorized';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Omit for the unauthenticated auth endpoints (signup/login). */
  actor?: ActorRole;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, actor } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (actor) {
    const token = getToken(actor);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    throw new ApiError(0, err instanceof Error ? err.message : 'Network request failed');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no/invalid JSON body — fine for 204s etc.
  }

  if (!res.ok) {
    if (res.status === 401 && actor) {
      const token = getToken(actor);
      if (token && token !== 'mock-dev-jwt-token') {
        clearToken(actor);
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { actor } }));
      }
    }
    const message =
      (data as { message?: string } | null)?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, (data as { errors?: unknown } | null)?.errors);
  }

  return data as T;
}
