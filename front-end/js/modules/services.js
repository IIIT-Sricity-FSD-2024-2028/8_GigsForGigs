// ─── services.js ────────────────────────────────────────────────
// Handles gig service posting and client-side service discovery.
// Pages: post-service.html, search-talent.html
// ─────────────────────────────────────────────────────────────────

import { services as seededServices, users } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { generateId, getInitials, truncate } from '../utils/helpers.js';

const SERVICES_KEY = 'gfg_services';

const SKILL_KEYWORDS = {
  react: ['react', 'frontend', 'full stack', 'spa'],
  design: ['design', 'ui', 'ux', 'figma', 'wireframe', 'prototyp'],
  node: ['node', 'node.js', 'backend', 'api', 'express'],
  marketing: ['marketing', 'seo', 'ads', 'social', 'analytics', 'content']
};

function getServicesFallback() {
  return Array.isArray(seededServices) ? seededServices.map((service) => ({ ...service })) : [];
}

function writeServices(list) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SERVICES_KEY, JSON.stringify(list));
    } catch {}
  }

  if (Array.isArray(seededServices)) {
    seededServices.length = 0;
    list.forEach((service) => seededServices.push(service));
  }
}

export function getServices() {
  const fallback = getServicesFallback();

  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) {
      localStorage.setItem(SERVICES_KEY, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function validateServiceInput(data) {
  if (!data || typeof data !== 'object') return 'Invalid service payload.';
  if (!String(data.title || '').trim()) return 'Service title is required.';
  if (!String(data.category || '').trim()) return 'Service category is required.';
  if (!String(data.description || '').trim()) return 'Service description is required.';

  const amount = Number(data.startingPrice);
  if (!Number.isFinite(amount) || amount <= 0) return 'Service amount must be a positive number.';

  return null;
}

export function saveService(data) {
  const error = validateServiceInput(data);
  if (error) return { ok: false, error };

  const allServices = getServices();
  const normalized = {
    id: generateId('s'),
    gigId: data.gigId,
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    category: String(data.category).trim(),
    pricing: data.pricing || 'fixed',
    deliveryDays: Number.isFinite(Number(data.deliveryDays)) ? Number(data.deliveryDays) : 7,
    startingPrice: Number(data.startingPrice),
    createdAt: new Date().toISOString()
  };

  allServices.push(normalized);
  writeServices(allServices);
  return { ok: true, service: normalized };
}

function getProvider(gigId) {
  return users.find((user) => user.id === gigId) || null;
}

function toRateBand(price, selectedBand) {
  if (!selectedBand) return true;
  if (selectedBand === '30') return price < 30;
  if (selectedBand === '60') return price >= 30 && price <= 60;
  if (selectedBand === '100') return price > 60 && price <= 100;
  if (selectedBand === '100+') return price > 100;
  return true;
}

function toSkillMatch(text, selectedSkill) {
  if (!selectedSkill) return true;
  const keywords = SKILL_KEYWORDS[selectedSkill] || [selectedSkill];
  return keywords.some((keyword) => text.includes(keyword));
}

function toRating(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function buildServiceCard(service, index) {
  const provider = service.provider;
  const providerName = provider?.name || 'Gig Professional';
  const providerTitle = provider?.title || 'Service Provider';
  const rating = Number(provider?.avgRating || 0);
  const reviews = Number(provider?.totalRatings || 0);
  const price = Number(service.startingPrice || provider?.hourlyRate || 0);
  const chips = Array.isArray(provider?.skills) && provider.skills.length > 0
    ? provider.skills.slice(0, 3)
    : [service.category];
  const bannerClass = ['talent-banner-blue', 'talent-banner-gold', 'talent-banner-green', 'talent-banner-pink'][index % 4];

  return `
    <div class="talent-card" data-service-id="${service.id}">
      <div class="talent-banner ${bannerClass}"></div>
      <div class="talent-body">
        <div class="talent-photo">
          <svg width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#d7e2ea"/><text x="32" y="38" text-anchor="middle" fill="#084b83" font-size="20" font-weight="700">${getInitials(providerName)}</text></svg>
        </div>
        <div class="talent-header">
          <span class="talent-name">${providerName}</span>
          <span class="talent-rate">$${price}<span>/hr</span></span>
        </div>
        <div class="talent-title">${providerTitle}</div>
        <div class="talent-rating">
          <span class="star">★</span> ${rating > 0 ? rating.toFixed(1) : 'New'} <span class="review-count">(${reviews} reviews)</span>
        </div>
        <p style="margin-top:8px;color:var(--color-text-muted);font-size:0.8rem;line-height:1.4;">${truncate(service.title, 64)}</p>
        <div class="talent-skills">
          ${chips.map((chip) => `<span class="skill-chip">${chip}</span>`).join('')}
        </div>
        <div class="talent-actions">
          <a href="#" class="btn-view-profile" data-provider-id="${provider?.id || ''}">View Profile</a>
          <a href="#" class="btn-hire" data-service-id="${service.id}">Hire</a>
        </div>
      </div>
    </div>
  `;
}

export function renderServices() {
  const grid = document.getElementById('talent-grid');
  if (!grid) return;

  const allServices = getServices().map((service) => {
    const provider = getProvider(service.gigId);
    return { ...service, provider };
  });

  const searchTerm = (document.getElementById('talent-search')?.value || '').trim().toLowerCase();
  const selectedSkill = document.getElementById('filter-skill')?.value || '';
  const selectedBudget = document.getElementById('filter-budget')?.value || '';
  const selectedRating = toRating(document.getElementById('filter-rating')?.value || 0);
  const selectedSort = document.getElementById('sort-talent')?.value || 'relevance';

  const filtered = allServices.filter((service) => {
    const provider = service.provider;
    const price = Number(service.startingPrice || provider?.hourlyRate || 0);
    const rating = Number(provider?.avgRating || 0);
    const searchableText = [
      service.title,
      service.description,
      service.category,
      provider?.name,
      provider?.title,
      ...(Array.isArray(provider?.skills) ? provider.skills : [])
    ].join(' ').toLowerCase();

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesSkill = toSkillMatch(searchableText, selectedSkill);
    const matchesBudget = toRateBand(price, selectedBudget);
    const matchesRating = !selectedRating || rating >= selectedRating;

    return matchesSearch && matchesSkill && matchesBudget && matchesRating;
  });

  if (selectedSort === 'rating') {
    filtered.sort((a, b) => Number(b.provider?.avgRating || 0) - Number(a.provider?.avgRating || 0));
  } else if (selectedSort === 'rate-low') {
    filtered.sort((a, b) => Number(a.startingPrice || 0) - Number(b.startingPrice || 0));
  } else if (selectedSort === 'rate-high') {
    filtered.sort((a, b) => Number(b.startingPrice || 0) - Number(a.startingPrice || 0));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div id="talent-empty-state" style="grid-column:1/-1;padding:var(--spacing-xxl);text-align:center;color:var(--color-text-muted);border:1px dashed var(--color-border);border-radius:var(--radius-lg);">
        No matching professionals found for the selected filters.
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map((service, index) => buildServiceCard(service, index)).join('');
  }

  const pagination = document.querySelector('.pagination');
  if (pagination) pagination.style.display = 'none';
}

function initSearchTalent() {
  const grid = document.getElementById('talent-grid');
  if (!grid) return;
  if (grid.dataset.searchBound === '1') return;

  const searchInput = document.getElementById('talent-search');
  const skillFilter = document.getElementById('filter-skill');
  const budgetFilter = document.getElementById('filter-budget');
  const ratingFilter = document.getElementById('filter-rating');
  const sortFilter = document.getElementById('sort-talent');

  if (searchInput) searchInput.addEventListener('input', renderServices);
  if (skillFilter) skillFilter.addEventListener('change', renderServices);
  if (budgetFilter) budgetFilter.addEventListener('change', renderServices);
  if (ratingFilter) ratingFilter.addEventListener('change', renderServices);
  if (sortFilter) sortFilter.addEventListener('change', renderServices);

  grid.dataset.searchBound = '1';
  renderServices();
}

function setPostServiceFeedback(message, isError = false) {
  let feedbackEl = document.getElementById('post-service-feedback');
  const form = document.getElementById('post-service-form');
  if (!form) return;

  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'post-service-feedback';
    feedbackEl.style.cssText = 'margin-top:var(--spacing-md);font-size:0.875rem;font-weight:600;';
    form.appendChild(feedbackEl);
  }

  feedbackEl.textContent = message;
  feedbackEl.style.color = isError ? 'var(--color-primary-blue)' : 'var(--color-secondary)';
}

function showServicePostedPopup(onDone) {
  const existing = document.getElementById('service-posted-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'service-posted-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,20,37,0.42);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px;';
  modal.innerHTML = `
    <div style="width:min(460px,100%);background:var(--color-white);border-radius:14px;padding:24px;border:1px solid var(--color-border);box-shadow:0 20px 60px rgba(8,75,131,0.22);text-align:center;">
      <div style="width:68px;height:68px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(81,158,138,0.14);color:var(--color-secondary);font-size:30px;font-weight:700;">✓</div>
      <h2 style="font-size:1.4rem;color:var(--color-text-dark);margin-bottom:10px;">Service Posted Successfully</h2>
      <p style="font-size:0.95rem;color:var(--color-text-muted);line-height:1.5;margin-bottom:18px;">Your service is now visible to clients. Redirecting to your dashboard...</p>
      <button id="service-posted-go-dashboard" type="button" class="btn btn-primary-blue" style="min-width:210px;">Go to Dashboard</button>
    </div>
  `;

  document.body.appendChild(modal);

  const finish = () => {
    if (modal.parentElement) modal.remove();
    if (typeof onDone === 'function') onDone();
  };

  const goBtn = document.getElementById('service-posted-go-dashboard');
  if (goBtn) goBtn.addEventListener('click', finish);

  setTimeout(finish, 1400);
}

function initPostService() {
  const user = getUser();
  if (!user || user.role !== 'gig') return;

  const form = document.getElementById('post-service-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const payload = {
      gigId: user.id,
      title: document.getElementById('service-title')?.value?.trim(),
      category: document.getElementById('category')?.value,
      deliveryDays: document.getElementById('delivery')?.value,
      description: document.getElementById('description')?.value?.trim(),
      pricing: document.querySelector('input[name="pricing"]:checked')?.value || 'fixed',
      startingPrice: Number(document.getElementById('amount')?.value)
    };

    const result = saveService(payload);
    if (!result.ok) {
      setPostServiceFeedback(result.error || 'Unable to save service.', true);
      return;
    }

    form.reset();
    setPostServiceFeedback('Service posted successfully. Redirecting to dashboard...', false);
    showServicePostedPopup(() => {
      window.location.href = 'gig-dashboard.html';
    });
  });
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('search-talent.html')) {
    initSearchTalent();
  } else if (path.includes('post-service.html')) {
    initPostService();
  }
}
