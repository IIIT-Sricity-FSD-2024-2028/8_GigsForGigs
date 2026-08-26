import React from 'react';

/**
 * @file AdminTabs.tsx
 * @description
 * Horizontal tab navigation bar with clean underline active states.
 */

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 'var(--spacing-lg)'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '0.65rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '3px solid var(--color-primary-blue)' : '3px solid transparent',
              color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'rgba(191, 105, 0, 0.15)' : 'var(--color-bg-light)',
                  color: isActive ? 'var(--color-primary-blue)' : 'var(--color-text-muted)'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
