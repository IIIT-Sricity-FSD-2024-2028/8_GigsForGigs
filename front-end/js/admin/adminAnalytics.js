// ─── adminAnalytics.js ──────────────────────────────────────────
// admin-analytics.html — Wire segment controls, populate stats.
// ─────────────────────────────────────────────────────────────────

import { adminClients, adminProfessionals, adminProjects, adminTransactions, fmtCurrency } from './adminData.js';

export function init() {
  populateStats();
  wireSegmentControls();
  wireFilters();
}

function populateStats() {
  // Populate any KPI-style values found on the analytics page
  const kpiValues = document.querySelectorAll('.anl-kpi-value, .analytics-kpi-value');
  if (kpiValues.length >= 4) {
    const totalRevenue = adminTransactions.reduce((s, t) => s + (t.amount || 0), 0);
    kpiValues[0].textContent = fmtCurrency(totalRevenue);
    kpiValues[1].textContent = adminProjects.length.toLocaleString();
    kpiValues[2].textContent = adminProfessionals.length.toLocaleString();
    kpiValues[3].textContent = adminClients.length.toLocaleString();
  }
}

function wireSegmentControls() {
  document.querySelectorAll('[class*="segment"]').forEach(group => {
    const btns = group.querySelectorAll('button');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
}

function wireFilters() {
  // Wire any dropdown selects
  document.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      // In a real scenario, this would re-fetch data for the selected timeframe
      console.log('[Analytics] Filter changed:', sel.value);
    });
  });
}
