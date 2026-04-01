// validation.js
// Shared form validation helpers for auth and dashboard forms.

// Standard email format regex.
// Accepts common addresses such as name@gmail.com and name.surname+tag@domain.co.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Name regex: letters and single spaces between words only.
// Rejects numbers and special characters.
const NAME_RE = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

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
    console.warn('Field not found:', fieldId);
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
  errEl.textContent = message;
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

function normalizeInput(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

/**
 * Validate email format.
 * Returns an empty string when valid, otherwise a meaningful error message.
 */
export function validateEmail(value, fieldLabel = 'Email') {
  const email = normalizeInput(value);

  if (!email) {
    return `${fieldLabel} is required.`;
  }

  if (!EMAIL_RE.test(email)) {
    return 'Please enter a valid email address (example: name@gmail.com).';
  }

  return '';
}

/**
 * Validate full name.
 * Rule: alphabets and spaces only after trimming.
 */
export function validateName(value, fieldLabel = 'Full name') {
  const name = normalizeInput(value);

  if (!name) {
    return `${fieldLabel} is required.`;
  }

  if (!NAME_RE.test(name)) {
    return `${fieldLabel} must contain only letters (A-Z) and spaces.`;
  }

  return '';
}

/**
 * Validate password.
 * Rule: required and minimum length of 8 characters.
 */
export function validatePassword(value, fieldLabel = 'Password') {
  const password = String(value || '');

  if (!password.trim()) {
    return `${fieldLabel} is required.`;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `${fieldLabel} must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return '';
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

  const normalizedEmail = normalizeInput(email?.value);
  if (email) email.value = normalizedEmail;

  const emailError = validateEmail(normalizedEmail);
  if (emailError) {
    showError('email', emailError);
    valid = false;
  }

  const passwordError = validatePassword(password?.value, 'Password');
  if (passwordError) {
    showError('password', passwordError);
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

  const normalizedName = normalizeInput(fullname?.value);
  if (fullname) fullname.value = normalizedName;

  const normalizedEmail = normalizeInput(email?.value);
  if (email) email.value = normalizedEmail;

  if (!role || !role.value) {
    showError('role', 'Please select a role.');
    valid = false;
  }

  const nameError = validateName(normalizedName);
  if (nameError) {
    showError('fullname', nameError);
    valid = false;
  }

  const emailError = validateEmail(normalizedEmail);
  if (emailError) {
    showError('email', emailError);
    valid = false;
  }

  const passwordError = validatePassword(password?.value, 'Password');
  if (passwordError) {
    showError('password', passwordError);
    valid = false;
  }

  if (!confirm || !confirm.value) {
    showError('confirm-password', 'Please confirm your password.');
    valid = false;
  } else if (password && confirm.value !== password.value) {
    showError('confirm-password', 'Passwords do not match.');
    valid = false;
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

  const normalizedEmail = normalizeInput(email?.value);
  if (email) email.value = normalizedEmail;

  const emailError = validateEmail(normalizedEmail);
  if (emailError) {
    showError(fieldId, emailError);
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
