// ─── services.js ────────────────────────────────────────────────
// Handles posting a new service by a gig professional.
// Pages: post-service.html
// ─────────────────────────────────────────────────────────────────

import { services } from '../data/mockData.js';
import { getUser } from '../utils/storage.js';
import { generateId } from '../utils/helpers.js';

// ── post-service.html ────────────────────────────────────────────

function initPostService() {
  const user = getUser();
  if (!user) return;

  const form = document.getElementById('post-service-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('service-title')?.value?.trim();
    const category = document.getElementById('category')?.value;
    const delivery = document.getElementById('delivery')?.value;
    const description = document.getElementById('description')?.value?.trim();
    const pricing = document.querySelector('input[name="pricing"]:checked')?.value || 'fixed';
    const amount = Number(document.getElementById('amount')?.value);

    // Basic validation
    if (!title || !category || !description || !amount || amount < 5) {
      alert('Please fill in all required fields.');
      return;
    }

    // Create the new service
    const newService = {
      id: generateId('s'),
      gigId: user.id,
      title,
      description,
      category,
      pricing,
      deliveryDays: Number(delivery) || 7,
      startingPrice: amount,
      createdAt: new Date().toISOString()
    };

    services.push(newService);

    // Redirect to success page
    window.location.href = 'service-published.html';
  });
}

// ── Public entry point ───────────────────────────────────────────

export function init() {
  const path = window.location.pathname;

  if (path.includes('post-service.html')) {
    initPostService();
  }
}
