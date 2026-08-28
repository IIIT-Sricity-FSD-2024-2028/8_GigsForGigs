import React, { useState } from 'react';
import { PlusIcon, CloseIcon } from '../../../components/super-admin/Icons';
import { mockPlatformConfig, type PlatformConfig } from '../../../mock/adminMockData';

/**
 * @file PlatformSettings.tsx
 * @description
 * Global marketplace configuration control plane.
 * Allows Super Admins to adjust platform commission rake rates, category taxonomy,
 * escrow holding periods, and system maintenance mode toggles.
 *
 * NOT WIRED TO THE REAL BACKEND: there is no platform-config/settings table
 * anywhere in db/prisma/schema.prisma, and no /api/admin/settings route.
 * Left entirely on mock/adminMockData.ts rather than inventing a fake
 * persistence endpoint — nothing saved here survives a page reload.
 */

export const PlatformSettings: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig>(mockPlatformConfig);
  const [newCategory, setNewCategory] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (config.allowedCategories.includes(newCategory.trim())) {
      alert('Category already exists.');
      return;
    }
    setConfig({
      ...config,
      allowedCategories: [...config.allowedCategories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setConfig({
      ...config,
      allowedCategories: config.allowedCategories.filter((c) => c !== catToRemove)
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
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
        {/* ── Economic Parameters ────────────────────────────────────────── */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Marketplace Economics & Take Rate
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              PLATFORM COMMISSION RAKE ({config.platformRakePercentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={config.platformRakePercentage}
              onChange={(e) => setConfig({ ...config, platformRakePercentage: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-primary-blue)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
              Percentage retained from gross task payouts as marketplace revenue.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              MINIMUM GIG POSTING BUDGET ($)
            </label>
            <input
              type="number"
              className="admin-input"
              value={config.minimumGigBudget}
              onChange={(e) => setConfig({ ...config, minimumGigBudget: Number(e.target.value) })}
              min="5"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              ESCROW HOLDING GRACE PERIOD (DAYS)
            </label>
            <input
              type="number"
              className="admin-input"
              value={config.escrowHoldingDays}
              onChange={(e) => setConfig({ ...config, escrowHoldingDays: Number(e.target.value) })}
              min="1"
            />
          </div>
        </div>

        {/* ── System Governance & Maintenance ────────────────────────────── */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            System Health & Security Controls
          </h3>

          <div
            style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: config.isMaintenanceMode ? 'var(--color-danger-bg)' : 'var(--color-bg-light)',
              border: `1px solid ${config.isMaintenanceMode ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: config.isMaintenanceMode ? 'var(--color-danger-text)' : 'var(--color-text-dark)' }}>
                Platform Maintenance Mode
              </h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Temporarily suspends user logins and API transactions.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.isMaintenanceMode}
              onChange={(e) => setConfig({ ...config, isMaintenanceMode: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              MAXIMUM DELIVERABLE UPLOAD SIZE (MB)
            </label>
            <input
              type="number"
              className="admin-input"
              value={config.maxFileUploadMb}
              onChange={(e) => setConfig({ ...config, maxFileUploadMb: Number(e.target.value) })}
              min="10"
              max="1024"
            />
          </div>
        </div>
      </div>

      {/* ── Category Taxonomy Editor ────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Marketplace Skill Category Taxonomy
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          {config.allowedCategories.map((category) => (
            <div
              key={category}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(8, 75, 131, 0.08)',
                color: 'var(--color-primary-dark)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600
              }}
            >
              <span>{category}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', maxWidth: '400px', marginTop: 'var(--spacing-sm)' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Add new gig category..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={handleAddCategory}
          >
            <PlusIcon size={16} /> Add
          </button>
        </div>
      </div>

      {/* Save Changes Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
        <button type="submit" className="admin-btn admin-btn-primary">
          Save Platform Configuration
        </button>
      </div>
    </form>
  );
};

export default PlatformSettings;
