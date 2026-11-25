import React from 'react';

/**
 * @file FilterPillBar.tsx
 * @description Shared pill filter toolbar with record counts and optional right-aligned CTA slot.
 */

export interface FilterPillOption<T extends string> {
  value: T;
  label: string;
  count: number;
}

export interface FilterPillBarProps<T extends string> {
  options: FilterPillOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  summaryText?: string;
  rightSlot?: React.ReactNode;
}

export function FilterPillBar<T extends string>({
  options,
  selected,
  onSelect,
  summaryText,
  rightSlot,
}: FilterPillBarProps<T>) {
  return (
    <div
      className="admin-card"
      style={{
        padding: 'var(--spacing-md) var(--spacing-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--spacing-md)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        {options.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${isActive ? 'var(--color-primary-dark)' : 'var(--color-border)'}`,
                backgroundColor: isActive ? 'var(--color-primary-dark)' : 'var(--color-bg-white)',
                color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                fontWeight: isActive ? 700 : 600,
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label} ({opt.count})
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginLeft: 'auto', flexWrap: 'wrap' }}>
        {summaryText && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {summaryText}
          </span>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
