// ─── validation.js ──────────────────────────────────────────────
// Form validation helpers.  Targets existing form fields and
// inline error elements by id.  Validates on submit only.
//
// Rules
//   • required fields    → non‑empty after trim
//   • email              → regex
//   • password           → min 8 chars
//   • confirm‑password   → must match password
//   • budget             → numeric, min ₹500
//   • deadline / dates   → must be a future date
// ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_BUDGET = 500;

// ── Private helpers ──────────────────────────────────────────────

/**
 * Show an inline error message next to a field.
 * Looks for an element with id  `${fieldId}-error`; if it doesn't
 * exist one is created immediately after the field.
 */
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) {
    console.warn('⚠️ Field not found:', fieldId);
    return;
  }

  field.style.borderColor = 'var(--color-primary-blue)';
  field.style.backgroundColor = 'rgba(8,75,131,0.05)';

  let errEl = document.getElementById(`${fieldId}-error`);
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = `${fieldId}-error`;
    errEl.style.cssText = 'color:var(--color-primary-blue);font-size:0.8rem;margin-top:4px;font-weight:500;';
    field.insertAdjacentElement('afterend', errEl);
  }
  errEl.textContent = '❌ ' + message;
  console.log('📍 Error on ' + fieldId + ':', message);
}

/**
 * Clear an error for a given field id.
 */
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.style.borderColor = '';
    field.style.backgroundColor = '';
  }

  const errEl = document.getElementById(`${fieldId}-error`);
  if (errEl) errEl.textContent = '';
}

/**
 * Clear all errors that were previously set on the form.
 */
function clearAllErrors(fieldIds) {
  fieldIds.forEach(clearError);
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Validate the login form.
 * Returns `true` when valid.
 */
export function validateLoginForm() {
  const fields = ['email', 'password'];
  clearAllErrors(fields);
  let valid = true;

  const email = document.getElementById('email');
  const password = document.getElementById('password');

  if (!email || !email.value.trim()) {
    showError('email', 'Email is required.');
    valid = false;
  } else if (!EMAIL_RE.test(email.value.trim())) {
    showError('email', 'Please enter a valid email address.');
    valid = false;
  }

  if (!password || !password.value) {
    showError('password', 'Password is required.');
    valid = false;
  } else if (password.value.length < MIN_PASSWORD_LENGTH) {
    showError('password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    valid = false;
  }

  return valid;
}

/**
 * Validate the signup form.
 * Returns `true` when valid.
 */
export function validateSignupForm() {
  const fields = ['role', 'fullname', 'email', 'password', 'confirm-password'];
  clearAllErrors(fields);
  let valid = true;

  const role = document.getElementById('role');
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm-password');

  if (!role || !role.value) {
    showError('role', 'Please select a role.');
    valid = false;
  }

  if (!fullname || !fullname.value.trim()) {
    showError('fullname', 'Full name is required.');
    valid = false;
  }

  if (!email || !email.value.trim()) {
    showError('email', 'Email is required.');
    valid = false;
  } else if (!EMAIL_RE.test(email.value.trim())) {
    showError('email', 'Please enter a valid email address.');
    valid = false;
  }

  if (!password || !password.value) {
    showError('password', 'Password is required.');
    valid = false;
  } else if (password.value.length < MIN_PASSWORD_LENGTH) {
    showError('password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    valid = false;
  }

  if (!confirm || !confirm.value) {
    showError('confirm-password', 'Please confirm your password.');
    valid = false;
  } else if (password && confirm.value !== password.value) {
    showError('confirm-password', 'Passwords do not match.');
    valid = false;
  }

  // If invalid, log all details for debugging
  if (!valid) {
    console.warn('❌ Signup validation failed');
    console.log('📋 Field values:', {
      role: role?.value || '(empty)',
      fullname: fullname?.value || '(empty)',
      email: email?.value || '(empty)',
      password: password?.value ? '(filled)' : '(empty)',
      confirm: confirm?.value ? '(filled)' : '(empty)'
    });
  }

  return valid;
}

/**
 * Validate the post‑gig form.
 * Returns `true` when valid.
 */
export function validatePostGigForm() {
  const fields = ['gig-title', 'category', 'description', 'budget'];
  clearAllErrors(fields);
  let valid = true;

  const title = document.getElementById('gig-title');
  const category = document.getElementById('category');
  const description = document.getElementById('description');
  const budget = document.getElementById('budget');

  if (!title || !title.value.trim()) {
    showError('gig-title', 'Gig title is required.');
    valid = false;
  }

  if (!category || !category.value) {
    showError('category', 'Please select a category.');
    valid = false;
  }

  if (!description || !description.value.trim()) {
    showError('description', 'Description is required.');
    valid = false;
  }

  if (!budget || !budget.value) {
    showError('budget', 'Budget is required.');
    valid = false;
  } else if (isNaN(Number(budget.value)) || Number(budget.value) < MIN_BUDGET) {
    showError('budget', `Budget must be at least ₹${MIN_BUDGET}.`);
    valid = false;
  }

  return valid;
}

/**
 * Validate the add‑manager form (simple email‑only form).
 * Works for both add-manager.html and add-manager-flow.html.
 * Returns `true` when valid.
 */
export function validateManagerInviteForm() {
  // Both pages use different ids — try both
  const fieldId = document.getElementById('manager-email') ? 'manager-email' : 'email';
  clearAllErrors([fieldId]);
  let valid = true;

  const email = document.getElementById(fieldId);

  if (!email || !email.value.trim()) {
    showError(fieldId, 'Email is required.');
    valid = false;
  } else if (!EMAIL_RE.test(email.value.trim())) {
    showError(fieldId, 'Please enter a valid email address.');
    valid = false;
  }

  return valid;
}

/**
 * Validate profile completion forms (client & gig).
 * Accepts an array of { id, label } for required fields.
 * Returns `true` when valid.
 */
export function validateProfileForm(requiredFields) {
  const ids = requiredFields.map(f => f.id);
  clearAllErrors(ids);
  let valid = true;

  for (const { id, label } of requiredFields) {
    const el = document.getElementById(id);
    if (!el) continue;
    const val = el.value ? el.value.trim() : '';
    if (!val) {
      showError(id, `${label} is required.`);
      valid = false;
    }
  }

  return valid;
}
