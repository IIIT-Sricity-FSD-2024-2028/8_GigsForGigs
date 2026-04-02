// ─── adminSettings.js ───────────────────────────────────────────
// platform-settings.html — Form save handlers, toggles.
// ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'gfg_admin_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}

function saveSettings(data) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch {}
}

export function init() {
  hydrateForm();
  bindSaveButtons();
  bindToggleSwitches();
}

function hydrateForm() {
  const settings = loadSettings();
  // Populate text inputs with stored values
  document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea').forEach(input => {
    const key = input.id || input.name;
    if (key && settings[key] !== undefined) {
      input.value = settings[key];
    }
  });
  // Populate toggles / checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const key = cb.id || cb.name;
    if (key && settings[key] !== undefined) {
      cb.checked = !!settings[key];
    }
  });
}

function bindSaveButtons() {
  // Bind all save / update buttons
  document.querySelectorAll('button').forEach(btn => {
    if (/save|update|apply/i.test(btn.textContent)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const settings = loadSettings();
        // Collect all inputs
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea').forEach(input => {
          const key = input.id || input.name;
          if (key) settings[key] = input.value;
        });
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          const key = cb.id || cb.name;
          if (key) settings[key] = cb.checked;
        });
        saveSettings(settings);
        showToast('Settings saved successfully!');
      });
    }
  });
}

function bindToggleSwitches() {
  // Make any toggle-style elements interactive
  document.querySelectorAll('.toggle-switch, .setting-toggle').forEach(toggle => {
    toggle.style.cursor = 'pointer';
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });
}

function showToast(message) {
  const existing = document.getElementById('admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--color-primary-dark);color:white;padding:12px 24px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:fadeIn 0.3s ease;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
