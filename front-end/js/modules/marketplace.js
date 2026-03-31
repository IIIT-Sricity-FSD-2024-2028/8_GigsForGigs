import { services, users, saveServices } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { formatCurrency, formatDate, generateId, getInitials, truncate } from '../utils/helpers.js';

const talentSearchState = {
  search: '',
  category: '',
  rate: '',
  score: ''
};

function getGigById(gigId) {
  return users.find((user) => user.id === gigId) || null;
}

function getSuccessScore(gig) {
  const rating = Number(gig?.avgRating || 0);
  if (!Number.isFinite(rating) || rating <= 0) return 80;
  return Math.max(50, Math.min(100, Math.round(rating * 20)));
}

function passesRateBand(service, gig, band) {
  const hourlyRate = Number(gig?.hourlyRate || service.startingPrice || 0);

  if (!band) return true;
  if (band === '1') return hourlyRate > 0 && hourlyRate < 30;
  if (band === '2') return hourlyRate >= 30 && hourlyRate <= 60;
  if (band === '3') return hourlyRate > 60;
  return true;
}

function renderSearchTalentResults() {
  const container = document.getElementById('talent-results-content');
  const subtitle = document.getElementById('search-talent-subtitle');
  if (!container) return;

  const enrichedServices = services
    .map((service) => {
      const gig = getGigById(service.gigId);
      const successScore = getSuccessScore(gig);

      return {
        ...service,
        gig,
        successScore
      };
    })
    .filter((service) => {
      const searchableText = [
        service.title,
        service.description,
        service.gig?.name,
        service.gig?.title,
        Array.isArray(service.gig?.skills) ? service.gig.skills.join(' ') : ''
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !talentSearchState.search || searchableText.includes(talentSearchState.search);
      const matchesCategory = !talentSearchState.category || service.category === talentSearchState.category;
      const matchesRate = passesRateBand(service, service.gig, talentSearchState.rate);
      const minimumScore = Number(talentSearchState.score || 0);
      const matchesScore = !minimumScore || service.successScore >= minimumScore;

      return matchesSearch && matchesCategory && matchesRate && matchesScore;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (subtitle) {
    subtitle.textContent = `${enrichedServices.length} service${enrichedServices.length === 1 ? '' : 's'} found from gig professionals.`;
  }

  if (enrichedServices.length === 0) {
    container.style.textAlign = 'center';
    container.style.padding = 'var(--spacing-xxl)';
    container.style.color = 'var(--color-text-muted)';
    container.innerHTML = 'No matching services yet. Try adjusting your filters.';
    return;
  }

  container.style.textAlign = 'left';
  container.style.padding = '0';
  container.style.color = '';
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--spacing-lg);">
      ${enrichedServices.map((service) => {
        const gig = service.gig;
        const providerName = gig?.name || 'Gig Professional';
        const providerTitle = gig?.title || 'Service Provider';
        const providerRate = Number(gig?.hourlyRate || service.startingPrice || 0);

        return `
          <article class="dashboard-section" style="margin:0;padding:var(--spacing-lg);display:flex;flex-direction:column;gap:var(--spacing-sm);">
            <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
              <div class="talent-avatar" style="width:40px;height:40px;font-size:0.9rem;color:var(--color-primary-blue);background-color:rgba(8,75,131,0.08);">${getInitials(providerName)}</div>
              <div>
                <div style="font-weight:700;color:var(--color-text-dark);font-size:0.95rem;">${providerName}</div>
                <div style="font-size:0.8rem;color:var(--color-text-muted);">${providerTitle}</div>
              </div>
            </div>
            <h3 style="font-size:1rem;font-weight:700;color:var(--color-primary-dark);line-height:1.3;">${service.title}</h3>
            <p style="font-size:0.85rem;color:var(--color-text-dark);line-height:1.5;">${truncate(service.description || 'No description provided.', 120)}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:var(--spacing-sm);border-top:1px solid var(--color-border);">
              <div>
                <div style="font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Starting</div>
                <div style="font-weight:700;color:var(--color-secondary);">${formatCurrency(service.startingPrice || providerRate)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.75rem;color:var(--color-text-muted);">Success</div>
                <div style="font-weight:700;color:var(--color-primary-dark);">${service.successScore}%</div>
              </div>
            </div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">Published ${formatDate(service.createdAt)}</div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function initSearchTalent() {
  const searchInput = document.getElementById('search-talent-search-input');
  const categoryFilter = document.getElementById('search-talent-category-filter');
  const rateFilter = document.getElementById('search-talent-rate-filter');
  const scoreFilter = document.getElementById('search-talent-score-filter');
  const clearButton = document.getElementById('search-talent-clear-btn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      talentSearchState.search = searchInput.value.trim().toLowerCase();
      renderSearchTalentResults();
    });
  }

  const applyFilters = () => {
    talentSearchState.category = categoryFilter?.value || '';
    talentSearchState.rate = rateFilter?.value || '';
    talentSearchState.score = scoreFilter?.value || '';
    renderSearchTalentResults();
  };

  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (rateFilter) rateFilter.addEventListener('change', applyFilters);
  if (scoreFilter) scoreFilter.addEventListener('change', applyFilters);

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (rateFilter) rateFilter.value = '';
      if (scoreFilter) scoreFilter.value = '';

      talentSearchState.search = '';
      talentSearchState.category = '';
      talentSearchState.rate = '';
      talentSearchState.score = '';

      renderSearchTalentResults();
    });
  }

  renderSearchTalentResults();
}

function setPostServiceFeedback(message, isError = false) {
  const feedback = document.getElementById('post-service-feedback');
  if (!feedback) return;

  feedback.textContent = message;
  feedback.style.display = 'block';
  feedback.style.color = isError ? 'var(--color-error, #b42318)' : 'var(--color-secondary)';
}

function renderMyServicesPreview(gigId) {
  const previewContainer = document.getElementById('my-services-preview');
  if (!previewContainer) return;

  const myServices = services
    .filter((service) => service.gigId === gigId)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  if (myServices.length === 0) {
    previewContainer.innerHTML = '<div style="color:var(--color-text-muted);">No services published yet.</div>';
    return;
  }

  previewContainer.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--spacing-md);">
      ${myServices.map((service) => `
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--spacing-md);background:var(--color-white);">
          <div style="font-weight:700;color:var(--color-text-dark);font-size:0.9rem;line-height:1.3;">${truncate(service.title, 58)}</div>
          <div style="font-size:0.8rem;color:var(--color-text-muted);margin-top:4px;">${formatDate(service.createdAt)}</div>
          <div style="font-weight:700;color:var(--color-secondary);margin-top:8px;">${formatCurrency(service.startingPrice)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function initPostService() {
  const user = getUser();
  if (!user || user.role !== 'gig') return;

  const form = document.querySelector('.form-page-container form');
  if (!form) return;

  renderMyServicesPreview(user.id);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('service-title')?.value.trim() || '';
    const category = document.getElementById('category')?.value || '';
    const delivery = Number(document.getElementById('delivery')?.value || 0);
    const description = document.getElementById('description')?.value.trim() || '';
    const amount = Number(document.getElementById('amount')?.value || 0);
    const pricing = document.querySelector('input[name="pricing"]:checked')?.value || 'fixed';

    if (!title || !category || !description || !Number.isFinite(amount) || amount <= 0) {
      setPostServiceFeedback('Enter valid service details before publishing.', true);
      return;
    }

    services.unshift({
      id: generateId('s'),
      gigId: user.id,
      title,
      description,
      category,
      deliveryDays: Number.isFinite(delivery) && delivery > 0 ? delivery : 7,
      pricing,
      startingPrice: amount,
      createdAt: new Date().toISOString()
    });

    saveServices();
    form.reset();
    setPostServiceFeedback('Service published. It is now visible in Search Talent.', false);
    renderMyServicesPreview(user.id);
  });
}

export function init() {
  const path = window.location.pathname;

  if (path.includes('search-talent.html')) {
    initSearchTalent();
  } else if (path.includes('post-service.html')) {
    initPostService();
  }
}
