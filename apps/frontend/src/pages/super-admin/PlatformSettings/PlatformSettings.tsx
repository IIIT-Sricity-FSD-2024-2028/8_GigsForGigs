import React, { useState, useEffect } from 'react';
import { PlusIcon, CloseIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface PlatformConfig {
  platformRakePercentage: number;
  minimumGigBudget: number;
  escrowHoldingDays: number;
  maxFileUploadMb: number;
  isMaintenanceMode: boolean;
  allowedCategories: string[];
}

export const PlatformSettings: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<PlatformConfig>({
    platformRakePercentage: 10.0,
    minimumGigBudget: 50,
    escrowHoldingDays: 14,
    maxFileUploadMb: 100,
    isMaintenanceMode: false,
    allowedCategories: ['Software Development', 'Design & Creative', 'AI & Data Science', '3D & Spatial Computing']
  });
  const [newCategory, setNewCategory] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      const data = await adminApi.getPlatformSettings();
      if (isMounted && data) {
        setConfig({
          ...data,
          allowedCategories: Array.isArray(data.allowedCategories) ? data.allowedCategories : [
            'Software Development', 'Design & Creative', 'AI & Data Science', '3D & Spatial Computing'
          ]
        });
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (config.allowedCategories.includes(newCategory.trim())) {
      toast.warning('Category Exists', 'This skill category is already in the platform taxonomy.');
      return;
    }
    setConfig({
      ...config,
      allowedCategories: [...config.allowedCategories, newCategory.trim()]
    });
    toast.info('Category Added', `Added "${newCategory.trim()}" to platform taxonomy.`);
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setConfig({
      ...config,
      allowedCategories: config.allowedCategories.filter((c) => c !== catToRemove)
    });
    toast.info('Category Removed', `Removed "${catToRemove}" from taxonomy.`);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    await adminApi.updatePlatformSettings(config);
    toast.success('Platform Settings Saved', `Platform commission set to ${config.platformRakePercentage}% and parameters updated.`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {isSaved && (
        <div
          className="admin-badge badge-success"
          style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 'var(--font-size-sm)' }}
        >
          ✓ Platform settings updated successfully and cached in Redis.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Economic Parameters */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Marketplace Economics & Take Rate
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Platform Commission Take Rate (% Rake)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                className="admin-input"
                value={config.platformRakePercentage}
                onChange={(e) => setConfig({ ...config, platformRakePercentage: parseFloat(e.target.value) || 0 })}
              />
              <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>%</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Deducted automatically from gross milestone payments upon release.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Minimum Gig Budget Floor ($ USD)
            </label>
            <input
              type="number"
              min="5"
              className="admin-input"
              value={config.minimumGigBudget}
              onChange={(e) => setConfig({ ...config, minimumGigBudget: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Escrow Dispute Holding Window (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              className="admin-input"
              value={config.escrowHoldingDays}
              onChange={(e) => setConfig({ ...config, escrowHoldingDays: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>

        {/* Operational Constraints */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            System Limits & Maintenance
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Deliverable Upload Ceiling (MB)
            </label>
            <input
              type="number"
              min="10"
              max="1024"
              className="admin-input"
              value={config.maxFileUploadMb}
              onChange={(e) => setConfig({ ...config, maxFileUploadMb: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.isMaintenanceMode}
                onChange={(e) => setConfig({ ...config, isMaintenanceMode: e.target.checked })}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger-text)' }}>
                  Platform Maintenance Mode
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Locks client contract creation and payment checkouts. Super admin operations remain unaffected.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Category Taxonomy Manager */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Marketplace Skill Categories & Taxonomy
        </h3>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
          Approved categories available for client job postings and freelancer talent profiles.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: 'var(--spacing-xs) 0' }}>
          {config.allowedCategories.map((cat) => (
            <span
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--color-bg-light)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-dark)'
              }}
            >
              {cat}
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)', display: 'flex' }}
              >
                <CloseIcon size={12} />
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="New Category Name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
          >
            <PlusIcon size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Submit Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {hasPermission('settings:manage') ? (
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: 'var(--font-size-sm)' }}
          >
            Save Platform Changes
          </button>
        ) : (
          <div style={{ backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Read-Only Settings (Auditor / Restricted Tier)
          </div>
        )}
      </div>
    </form>
  );
};

export default PlatformSettings;
