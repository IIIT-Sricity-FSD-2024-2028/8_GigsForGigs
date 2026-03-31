// ─── profile.js ─────────────────────────────────────────────────
// profile-completion-client.html → save client profile to localStorage
// profile-completion-gig.html   → save gig profile to localStorage
// gig-profile.html              → display and inline‑edit saved profile
// ─────────────────────────────────────────────────────────────────

import { users } from '../data/mockData.js';
import { getUser, setUser, get, set } from '../utils/storage.js';
import { validateProfileForm } from '../utils/validation.js';
import { getInitials } from '../utils/helpers.js';

// ── profile-completion-client.html ───────────────────────────────

function initProfileCompletionClient() {
  const user = getUser();

  // Both pages at /pages/ and /pages/client/ have a form with this id
  const form = document.getElementById('client-profile-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const required = [
      { id: 'company-name', label: 'Company Name' },
      { id: 'industry', label: 'Industry' }
    ];

    if (!validateProfileForm(required)) return;

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
        u.isFirstTimeUser = false;  // Mark as no longer first-time after profile completion
      }
    }

    // Navigate to profile selection
    const isFirstTime = sessionStorage.getItem('isFirstTimeJoin') === '1';
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const required = [
      { id: 'job-title', label: 'Professional Title' },
      { id: 'experience', label: 'Years of Experience' }
    ];

    if (!validateProfileForm(required)) return;

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
      if (u) Object.assign(u, profileData);
      setUser({ ...user, name: user.name }); // refresh session
    }

    const isFirstTime = sessionStorage.getItem('isFirstTimeJoin') === '1';
    if (isFirstTime) {
      sessionStorage.setItem('isFirstTimeJoin', '1');
    }

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
