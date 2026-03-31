// ─── storage.js ─────────────────────────────────────────────────
// Thin localStorage wrapper.  Every other module uses these
// helpers instead of touching localStorage directly.
// ─────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'gfg_';
const USER_KEY = `${STORAGE_PREFIX}user`;

/**
 * Read a value from localStorage (auto‑parses JSON).
 * Returns `null` when the key does not exist.
 */
export function get(key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write a value to localStorage (auto‑stringifies).
 */
export function set(key, value) {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

/**
 * Remove a single key from localStorage.
 */
export function remove(key) {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

// ── Session‑user shortcuts ───────────────────────────────────────

/**
 * Get the currently logged‑in user object.
 * Shape: { id, name, role }   (or null when not logged in)
 */
export function getUser() {
  try {
    const localRaw = localStorage.getItem(USER_KEY);
    if (localRaw !== null) return JSON.parse(localRaw);
  } catch {}

  try {
    const sessionRaw = sessionStorage.getItem(USER_KEY);
    return sessionRaw === null ? null : JSON.parse(sessionRaw);
  } catch {}

  return null;
}

/**
 * Persist the logged‑in user to localStorage.
 * Expects at minimum { id, name, role }.
 */
export function setUser(user) {
  const payload = JSON.stringify(user);
  try {
    localStorage.setItem(USER_KEY, payload);
  } catch {}

  try {
    sessionStorage.setItem(USER_KEY, payload);
  } catch {}
}

/**
 * Clear the current session (logout helper).
 */
export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}

  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {}
}

/**
 * Clear all app-scoped persisted state so onboarding can restart cleanly.
 */
export function clearAppState() {
  try {
    const localKeys = Object.keys(localStorage);
    for (const key of localKeys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    const sessionKeys = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      if (key.startsWith(STORAGE_PREFIX) || key === 'isFirstTimeJoin') {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}
}
