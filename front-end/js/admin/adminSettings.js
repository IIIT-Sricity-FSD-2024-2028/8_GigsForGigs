import { showToast } from './adminShared.js';
export function init() {
  const seedBtn = document.getElementById('reseed-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      showToast('Seed data is loaded automatically on server start. Restart the backend to re-seed.', 'info');
    });
  }
}
