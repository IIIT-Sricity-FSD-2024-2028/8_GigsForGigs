import React from 'react';

/**
 * @file SimpleCharts.tsx
 * @description
 * High-performance, zero-dependency SVG data visualization components.
 * Renders Donut, Bar, and Line charts using pure mathematical geometry calculations
 * with the original design tokens.
 */

// ── 1. Donut Chart ──────────────────────────────────────────────────────────
export interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

export const DonutChart: React.FC<{ data: DonutSegment[]; size?: number }> = ({ data, size = 180 }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let accumulatedAngle = 0;

  const radius = size * 0.38;
  const center = size / 2;
  const strokeWidth = size * 0.16;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-bg-light)" strokeWidth={strokeWidth} />
        {data.map((seg, idx) => {
          const percentage = total > 0 ? seg.count / total : 0;
          const strokeDasharray = `${percentage * 2 * Math.PI * radius} ${2 * Math.PI * radius}`;
          const strokeDashoffset = -accumulatedAngle * 2 * Math.PI * radius;
          accumulatedAngle += percentage;

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transform: `rotate(-90deg)`, transformOrigin: 'center', transition: 'stroke-dasharray 0.3s ease' }}
            />
          );
        })}
        <text x={center} y={center + 6} textAnchor="middle" fontSize={size * 0.14} fontWeight="700" fill="var(--color-text-dark)">
          {total}
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
        {data.map((seg, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: 'var(--font-size-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }} />
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{seg.label}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 2. Simple Bar Chart ─────────────────────────────────────────────────────
export interface BarItem {
  label: string;
  count: number;
  color: string;
}

export const HorizontalBarChart: React.FC<{ data: BarItem[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', width: '100%' }}>
      {data.map((item, idx) => {
        const percent = Math.round((item.count / max) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
              <span style={{ color: 'var(--color-text-dark)' }}>{item.label}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{item.count.toLocaleString()}</span>
            </div>
            <div style={{ height: '10px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  backgroundColor: item.color,
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── 3. Revenue Trend Area Chart ─────────────────────────────────────────────
export interface RevenuePoint {
  date: string;
  gmv: number;
  rake: number;
}

export const RevenueAreaChart: React.FC<{ data: RevenuePoint[]; height?: number }> = ({ data, height = 160 }) => {
  const max = Math.max(1, ...data.map((d) => d.gmv));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 360;
    const y = height - (d.gmv / max) * (height - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} 360,${height}`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <svg viewBox={`0 0 360 ${height}`} style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bf6900" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#bf6900" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#revenueGrad)" />
        <polyline fill="none" stroke="#bf6900" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 360;
          const y = height - (d.gmv / max) * (height - 30) - 15;
          return (
            <circle key={i} cx={x} cy={y} r="4" fill="#ffffff" stroke="#bf6900" strokeWidth="2.5" />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        {data.map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
};
