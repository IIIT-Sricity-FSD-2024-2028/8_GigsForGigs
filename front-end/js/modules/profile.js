// ─── profile.js ─────────────────────────────────────────────────
// profile-completion-client.html → save client profile to localStorage
// profile-completion-gig.html   → save gig profile to localStorage
// gig-profile.html              → display and inline‑edit saved profile
// ─────────────────────────────────────────────────────────────────

import { users, saveUsers } from '../data/mockData.js';
import { getUser, setUser, get, set } from '../utils/storage.js';
import { showError, clearError } from '../utils/validation.js';
import { getInitials } from '../utils/helpers.js';

// ── profile-completion-client.html ───────────────────────────────

function initProfileCompletionClient() {
  const user = getUser();

  // Both pages at /pages/ and /pages/client/ have a form with this id
  const form = document.getElementById('client-profile-form');
  if (!form) return;

  const TEXT_ONLY_RE = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
  const ALLOWED_INDUSTRIES = new Set(['tech', 'marketing', 'finance', 'other']);
  const ALLOWED_COMPANY_SIZES = new Set(['1-10', '11-50', '51-200', '200+']);
  const currentYear = new Date().getFullYear();
  const foundedYearInput = document.getElementById('founded');
  if (foundedYearInput) {
    foundedYearInput.setAttribute('min', '1900');
    foundedYearInput.setAttribute('max', String(currentYear));
    foundedYearInput.setAttribute('step', '1');
  }

  function normalize(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function validateCompanyName(value) {
    const companyName = normalize(value);
    if (!companyName) return 'Company Name is required.';
    if (!TEXT_ONLY_RE.test(companyName)) {
      return 'Company Name can only contain letters, numbers, and spaces.';
    }
    return '';
  }

  function validateIndustry(value) {
    if (!value) return 'Industry is required.';
    if (!ALLOWED_INDUSTRIES.has(value)) return 'Please select a valid industry.';
    return '';
  }

  function validateWebsite(value) {
    const website = String(value || '').trim();
    if (!website) return '';

    if (!/^https?:\/\//i.test(website)) {
      return 'Website must start with http:// or https://.';
    }

    try {
      new URL(website);
    } catch {
      return 'Please enter a valid website URL.';
    }

    return '';
  }

  function validateCompanySize(value) {
    if (!value || !ALLOWED_COMPANY_SIZES.has(value)) {
      return 'Please select a valid company size.';
    }
    return '';
  }

  function validateFoundedYear(value) {
    const yearValue = String(value || '').trim();
    if (!yearValue) return '';

    if (!/^\d{4}$/.test(yearValue)) {
      return 'Year Founded must be a 4-digit year.';
    }

    const year = Number(yearValue);
    if (Number.isNaN(year) || year < 1900 || year > currentYear) {
      return `Year Founded must be between 1900 and ${currentYear}.`;
    }

    return '';
  }

  function validateDescription(value) {
    const description = normalize(value);
    if (!description) return '';
    if (!TEXT_ONLY_RE.test(description)) {
      return 'Company Description can only contain letters, numbers, and spaces.';
    }
    return '';
  }

  const fieldValidators = {
    'company-name': validateCompanyName,
    industry: validateIndustry,
    website: validateWebsite,
    'company-size': validateCompanySize,
    founded: validateFoundedYear,
    desc: validateDescription
  };

  function validateField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return true;

    const validator = fieldValidators[fieldId];
    if (!validator) return true;

    const error = validator(el.value);
    if (error) {
      showError(fieldId, error);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  function validateClientProfileForm() {
    let valid = true;
    Object.keys(fieldValidators).forEach((fieldId) => {
      if (!validateField(fieldId)) valid = false;
    });
    return valid;
  }

  form.noValidate = true;

  Object.keys(fieldValidators).forEach((fieldId) => {
    const el = document.getElementById(fieldId);
    if (!el) return;

    const runFieldValidation = () => validateField(fieldId);
    el.addEventListener('input', runFieldValidation);
    el.addEventListener('change', runFieldValidation);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateClientProfileForm()) return;

    const companyNameInput = document.getElementById('company-name');
    const websiteInput = document.getElementById('website');
    const foundedInput = document.getElementById('founded');
    const descriptionInput = document.getElementById('desc');

    if (companyNameInput) companyNameInput.value = normalize(companyNameInput.value);
    if (websiteInput) websiteInput.value = websiteInput.value.trim();
    if (foundedInput) foundedInput.value = foundedInput.value.trim();
    if (descriptionInput) descriptionInput.value = normalize(descriptionInput.value);

    const profileData = {
      companyName: document.getElementById('company-name')?.value.trim() || '',
      industry: document.getElementById('industry')?.value || '',
      website: document.getElementById('website')?.value.trim() || '',
      companySize: document.getElementById('company-size')?.value || '',
      founded: document.getElementById('founded')?.value || '',
      description: document.getElementById('desc')?.value.trim() || ''
    };

    // Persist to localStorage
    set('client_profile', profileData);

    // Update in‑memory user record
    if (user) {
      const u = users.find(x => x.id === user.id);
      if (u) {
        Object.assign(u, profileData);
        u.isFirstTimeUser = false;
        u.isProfileComplete = true;
        saveUsers();
      }
    }

    // Navigate to profile selection
    const isFirstTime = sessionStorage.getItem('isFirstTimeJoin') === '1';
    sessionStorage.removeItem('isFirstTimeJoin');
    sessionStorage.removeItem('gfg_onboarding_role');
    sessionStorage.removeItem('gfg_pending_user');
    window.location.href = isFirstTime
      ? 'client-profile-selection.html?firstTime=1'
      : 'client-profile-selection.html';
  });
}

// ── profile-completion-gig.html (both /pages/ and /pages/gig/) ───

function initProfileCompletionGig() {
  const user = getUser();

  const form = document.getElementById('gig-profile-form');
  if (!form) return;

  const TEXT_ONLY_RE = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
  const SKILLS_RE = /^[A-Za-z0-9 ]+(?:\s*,\s*[A-Za-z0-9 ]+)*$/;
  const ALLOWED_AVAILABILITY = new Set(['full-time', 'part-time', 'as-needed']);

  function normalize(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function validateJobTitle(value) {
    const title = normalize(value);
    if (!title) return 'Professional Title is required.';
    if (!TEXT_ONLY_RE.test(title)) {
      return 'Professional Title can only contain letters, numbers, and spaces.';
    }
    return '';
  }

  function validateExperience(value) {
    if (!value) return 'Years of Experience is required.';
    return '';
  }

  function validateSkills(value) {
    const skills = normalize(value);
    if (!skills) return '';
    if (!SKILLS_RE.test(skills)) {
      return 'Skills can only use letters, numbers, spaces, and commas.';
    }
    return '';
  }

  function validatePortfolio(value) {
    const portfolio = String(value || '').trim();
    if (!portfolio) return '';

    if (!/^https?:\/\//i.test(portfolio)) {
      return 'Portfolio URL must start with http:// or https://.';
    }

    try {
      new URL(portfolio);
    } catch {
      return 'Please enter a valid portfolio URL.';
    }

    return '';
  }

  function validateBio(value) {
    const bio = normalize(value);
    if (!bio) return '';
    if (!TEXT_ONLY_RE.test(bio)) {
      return 'Professional Bio can only contain letters, numbers, and spaces.';
    }
    return '';
  }

  function validateHourlyRate(value) {
    const rate = String(value || '').trim();
    if (!rate) return '';
    const amount = Number(rate);
    if (Number.isNaN(amount) || amount < 0) {
      return 'Hourly Rate must be a valid number greater than or equal to 0.';
    }
    return '';
  }

  function validateAvailability(value) {
    if (!value || !ALLOWED_AVAILABILITY.has(value)) {
      return 'Please select a valid availability option.';
    }
    return '';
  }

  const fieldValidators = {
    'job-title': validateJobTitle,
    experience: validateExperience,
    skills: validateSkills,
    portfolio: validatePortfolio,
    bio: validateBio,
    'hourly-rate': validateHourlyRate,
    availability: validateAvailability
  };

  function validateField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return true;

    const validator = fieldValidators[fieldId];
    if (!validator) return true;

    const error = validator(el.value);
    if (error) {
      showError(fieldId, error);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  function validateGigProfileForm() {
    let valid = true;
    Object.keys(fieldValidators).forEach((fieldId) => {
      if (!validateField(fieldId)) valid = false;
    });
    return valid;
  }

  form.noValidate = true;

  Object.keys(fieldValidators).forEach((fieldId) => {
    const el = document.getElementById(fieldId);
    if (!el) return;

    const runFieldValidation = () => validateField(fieldId);
    el.addEventListener('input', runFieldValidation);
    el.addEventListener('change', runFieldValidation);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateGigProfileForm()) return;

    const titleInput = document.getElementById('job-title');
    const skillsInput = document.getElementById('skills');
    const portfolioInput = document.getElementById('portfolio');
    const bioInput = document.getElementById('bio');

    if (titleInput) titleInput.value = normalize(titleInput.value);
    if (skillsInput) skillsInput.value = normalize(skillsInput.value);
    if (portfolioInput) portfolioInput.value = portfolioInput.value.trim();
    if (bioInput) bioInput.value = normalize(bioInput.value);

    const profileData = {
      title: document.getElementById('job-title')?.value.trim() || '',
      experience: document.getElementById('experience')?.value || '',
      skills: (document.getElementById('skills')?.value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      bio: document.getElementById('bio')?.value.trim() || '',
      portfolio: document.getElementById('portfolio')?.value.trim() || '',
      hourlyRate: parseFloat(document.getElementById('hourly-rate')?.value) || 0,
      availability: document.getElementById('availability')?.value || ''
    };

    // Persist to localStorage
    set('gig_profile', profileData);

    // Update in‑memory user record
    if (user) {
      const u = users.find(x => x.id === user.id);
      if (u) {
        Object.assign(u, profileData);
        u.isFirstTimeUser = false;
        u.isProfileComplete = true;
        saveUsers();
      }
      setUser({ ...user, name: user.name }); // refresh session
    }

    sessionStorage.removeItem('isFirstTimeJoin');
    sessionStorage.removeItem('gfg_onboarding_role');
    sessionStorage.removeItem('gfg_pending_user');

    // Determine correct redirect based on page depth
    const path = window.location.pathname;
    if (path.includes('/gig/')) {
      window.location.href = 'gig-dashboard.html';
    } else {
      window.location.href = './gig/gig-dashboard.html';
    }
  });
}

// ── gig-profile.html (display + inline edit) ─────────────────────

function initGigProfile() {
  const user = getUser();
  if (!user) return;

  const u = users.find(x => x.id === user.id);
  if (!u) return;

  // Also load persisted profile data and merge
  const saved = get('gig_profile');
  if (saved) Object.assign(u, saved);

  // ── Populate profile display ──────────────────────────────────

  const avatarEl = document.getElementById('profile-avatar-text');
  if (avatarEl) avatarEl.textContent = getInitials(u.name);

  const nameEl = document.getElementById('profile-name-text');
  if (nameEl) {
    nameEl.innerHTML = `${u.name} <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-secondary)" stroke="var(--color-white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  }

  const subtitleEl = document.getElementById('profile-subtitle-text');
  if (subtitleEl) {
    subtitleEl.textContent = `${u.title || 'Professional'} • ${u.location || 'Location not set'}`;
  }

  const aboutEl = document.getElementById('about-me-text');
  if (aboutEl) aboutEl.textContent = u.bio || 'No bio provided yet.';

  const skillsEl = document.getElementById('skills-list');
  if (skillsEl) {
    const skills = u.skills || [];
    if (skills.length === 0) {
      skillsEl.innerHTML = '<span class="skill-tag" style="color:var(--color-text-muted);">No skills added</span>';
    } else {
      skillsEl.innerHTML = skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    }
  }

  const successEl = document.getElementById('job-success-text');
  if (successEl) successEl.textContent = '98%';

  const successBar = document.getElementById('job-success-bar');
  if (successBar) successBar.style.width = '98%';

  // ── Inline edit toggle ────────────────────────────────────────

  const editBtn = document.querySelector('.btn-outline[style*="min-width: 140px"]')
    || document.querySelector('.dashboard-content .btn-outline');

  if (editBtn) {
    let isEditing = false;

    editBtn.addEventListener('click', () => {
      isEditing = !isEditing;

      if (isEditing) {
        editBtn.textContent = 'Save Profile';
        editBtn.classList.remove('btn-outline');
        editBtn.classList.add('btn-primary');

        // Make about-me editable
        if (aboutEl) {
          aboutEl.contentEditable = 'true';
          aboutEl.style.border = '1px solid var(--color-border)';
          aboutEl.style.padding = 'var(--spacing-sm)';
          aboutEl.style.borderRadius = 'var(--radius-sm)';
          aboutEl.focus();
        }
      } else {
        editBtn.textContent = 'Edit My Profile';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-outline');

        // Save changes
        if (aboutEl) {
          aboutEl.contentEditable = 'false';
          aboutEl.style.border = '';
          aboutEl.style.padding = '';
          u.bio = aboutEl.textContent.trim();
        }

        // Persist
        set('gig_profile', {
          title: u.title,
          experience: u.experience,
          skills: u.skills,
          bio: u.bio,
          portfolio: u.portfolio,
          hourlyRate: u.hourlyRate,
          availability: u.availability
        });
      }
    });
  }

  // Update sidebar footer with user info
  const sidebarName = document.querySelector('.sidebar-footer div[style*="font-weight: 600"]');
  if (sidebarName) sidebarName.textContent = u.name;

  const sidebarMini = document.querySelector('.profile-mini');
  if (sidebarMini) sidebarMini.textContent = getInitials(u.name);
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('profile-completion-client.html')) {
    initProfileCompletionClient();
  } else if (path.includes('profile-completion-gig.html')) {
    initProfileCompletionGig();
  } else if (path.includes('gig-profile.html')) {
    initGigProfile();
  }
}
