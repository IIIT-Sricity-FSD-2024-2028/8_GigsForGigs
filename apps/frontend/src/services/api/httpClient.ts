/**
 * @file httpClient.ts
 * @description
 * Single shared fetch wrapper for every `services/api/<role>/*Api.ts` module.
 * Attaches the right actor's bearer token, parses JSON consistently, and
 * throws a typed ApiError on any non-2xx response (including network
 * failures, which surface as a status: 0 ApiError) so callers can branch on
 * `err.status` instead of re-implementing fetch/try-catch per file.
 */

// The Express server defaults to port 5000 (see apps/backend/src/server.ts).
// Keep an explicit environment override for deployments, but do not point the
// browser at the old pre-merge port 3000: that port has no API server and made
// every login fail as a network error.
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

// Production builds without VITE_API_BASE_URL assume the API is served from
// the same origin under /api (reverse proxy); dev talks to the local :5000 server.
export const API_BASE_URL =
  configuredApiUrl ||
  (import.meta.env.PROD ? '/api' : `${window.location.protocol}//${window.location.hostname}:5000/api`);

/** One sessionStorage key per actor — session-scoped so closing the tab or leaving
 * the site clears the session and returns visitors directly to the Landing Page. */
export type ActorRole = 'client' | 'manager' | 'gig_professional' | 'admin';

const TOKEN_KEYS: Record<ActorRole, string> = {
  client: 'g4g_client_token',
  manager: 'g4g_manager_token',
  gig_professional: 'g4g_gig_token',
  admin: 'g4g_admin_token',
};

// Older builds kept tokens in localStorage (survives tab close). Wipe them on load.
Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
localStorage.removeItem('gfg_active_user');

/** Read the saved JWT for one actor (null when that actor isn't logged in). */
export function getToken(actor: ActorRole): string | null {
  return sessionStorage.getItem(TOKEN_KEYS[actor]);
}

/** Save the JWT returned by login/signup for one actor. */
export function setToken(actor: ActorRole, token: string): void {
  sessionStorage.setItem(TOKEN_KEYS[actor], token);
}

/** Forget one actor's JWT (logout / expired session). */
export function clearToken(actor: ActorRole): void {
  sessionStorage.removeItem(TOKEN_KEYS[actor]);
}

/** Every role's token slot — handy for "log out of everything". */
export const ALL_ACTORS: ActorRole[] = ['client', 'manager', 'gig_professional', 'admin'];

/** Error thrown by apiFetch for any failed request. `status` is 0 for network errors. */
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

/**
 * Call the backend and return the parsed JSON body typed as T.
 * @param path    API path after the base URL, e.g. '/client/tasks'.
 * @param options method (default GET), JSON body, and which actor's token to send.
 * @throws ApiError on network failure or any non-2xx response.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, actor } = options;

  // Always JSON; add "Authorization: Bearer <jwt>" when the call is made on behalf of an actor.
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
    throw new ApiError(0, err instanceof Error ? err.message : 'Network request failed. Ensure backend server is running.');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no/invalid JSON body — fine for 204s etc.
  }

  if (!res.ok) {
    // 401 = token expired/revoked: drop it and tell AuthContext to log this actor out.
    if (res.status === 401 && actor) {
      clearToken(actor);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { actor } }));
    }
    // Prefer the backend's own error message when it sent one.
    const message =
      (data as { message?: string } | null)?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, (data as { errors?: unknown } | null)?.errors);
  }

  return data as T;
}
