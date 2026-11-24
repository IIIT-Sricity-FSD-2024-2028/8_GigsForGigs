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

export type ActorRole = 'client' | 'manager' | 'gig_professional' | 'admin';
type TokenReader = (actor: ActorRole) => string | null;
let readToken: TokenReader = () => null;

/** Injected by store setup; keeps this transport module independent of Redux imports. */
export function configureTokenReader(reader: TokenReader) { readToken = reader; }

/** Return the in-memory Redux token for the active actor only. */
export function getToken(actor: ActorRole): string | null { return readToken(actor); }

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

/** Fired whenever a request for `actor` comes back 401 so the Redux auth adapter can clear session state. */
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
    // 401 = token expired/revoked: tell the Redux auth adapter to clear the session.
    if (res.status === 401 && actor) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { actor } }));
    }
    // Prefer the backend's own error message when it sent one.
    const message =
      (data as { message?: string } | null)?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, (data as { errors?: unknown } | null)?.errors);
  }

  return data as T;
}
