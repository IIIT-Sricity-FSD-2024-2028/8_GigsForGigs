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
    const raw = localStorage.getItem(USER_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist the logged‑in user to localStorage.
 * Expects at minimum { id, name, role }.
 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear the current session (logout helper).
 */
export function clearUser() {
  localStorage.removeItem(USER_KEY);
}
