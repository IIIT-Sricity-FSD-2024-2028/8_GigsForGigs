import React from 'react';
import { TrendingUpIcon } from './Icons';

/**
 * @file KPICard.tsx
 * @description
 * Reusable Metric Tile for the Super Admin Dashboard and Analytics views.
 * Features high-contrast typography, semantic trend delta pills, and accessible iconography.
 */

export interface KPICardProps {
  title: string;
  value: string | number;
  deltaText?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  deltaText,
  isPositive = true,
  subtitle,
  icon,
  accentColor = 'var(--color-primary-dark)'
}) => {
  return (
    <div
      className="admin-card"
      style={{
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top accent highlight bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: accentColor
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon && (
          <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', color: accentColor }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-text-dark)', letterSpacing: '-0.03em' }}>
          {value}
        </h2>
        {deltaText && (
          <span
            className={`admin-badge ${isPositive ? 'badge-success' : 'badge-danger'}`}
            style={{ fontSize: 'var(--font-size-xs)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
          >
            <TrendingUpIcon size={12} />
            {deltaText}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
