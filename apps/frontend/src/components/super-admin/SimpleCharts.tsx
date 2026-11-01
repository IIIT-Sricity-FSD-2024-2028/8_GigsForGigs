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

export const RevenueAreaChart: React.FC<{ data?: RevenuePoint[]; height?: number }> = ({ data = [], height = 180 }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
        No transaction records found for this time window.
      </div>
    );
  }

  const safeData = data;

  const max = Math.max(1, ...safeData.map((d) => Math.max(Number(d.gmv) || 0, Number(d.rake) || 0)));
  const divisor = Math.max(1, safeData.length - 1);

  const pointsGmv = safeData.map((d, i) => {
    const x = (i / divisor) * 360;
    const gmv = Number(d.gmv) || 0;
    const y = height - (gmv / max) * (height - 40) - 20;
    return `${Number.isFinite(x) ? x : 0},${Number.isFinite(y) ? y : height / 2}`;
  }).join(" ");

  const areaPointsGmv = `0,${height} ${pointsGmv} 360,${height}`;

  const pointsRake = safeData.map((d, i) => {
    const x = (i / divisor) * 360;
    const rake = Number(d.rake) || 0;
    const y = height - (rake / max) * (height - 40) - 20;
    return `${Number.isFinite(x) ? x : 0},${Number.isFinite(y) ? y : height / 2}`;
  }).join(" ");

  const areaPointsRake = `0,${height} ${pointsRake} 360,${height}`;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
      {/* Chart Legend */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#D97706" }} />
          <span style={{ color: "var(--color-text-dark)" }}>Gross Merchandise Volume (GMV)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#0F527E" }} />
          <span style={{ color: "var(--color-text-dark)" }}>Net Platform Take Rate (10% Rake)</span>
        </div>
      </div>

      <svg viewBox={`0 0 360 ${height}`} style={{ width: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="rakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F527E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0F527E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Scale Reference Gridlines & Dynamic Scale Tag */}
        <line x1="0" y1="20" x2="360" y2="20" stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
        <line x1="0" y1={height / 2} x2="360" y2={height / 2} stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
        <line x1="0" y1={height - 20} x2="360" y2={height - 20} stroke="rgba(0,0,0,0.12)" />
        <text x="4" y="16" fill="var(--color-text-muted)" fontSize="9" fontWeight="600">
          Peak Velocity: ₹{Math.round(max).toLocaleString("en-IN")}
        </text>

        {/* GMV Area & Line */}
        <polygon points={areaPointsGmv} fill="url(#gmvGrad)" />
        <polyline fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsGmv} />
        {safeData.map((d, i) => {
          const x = (i / divisor) * 360;
          const gmv = Number(d.gmv) || 0;
          const y = height - (gmv / max) * (height - 40) - 20;
          return (
            <circle
              key={"gmv-" + i}
              cx={Number.isFinite(x) ? x : 0}
              cy={Number.isFinite(y) ? y : height / 2}
              r="4"
              fill="#ffffff"
              stroke="#D97706"
              strokeWidth="2"
            />
          );
        })}

        {/* Platform Rake Area & Line */}
        <polygon points={areaPointsRake} fill="url(#rakeGrad)" />
        <polyline fill="none" stroke="#0F527E" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" points={pointsRake} />
        {safeData.map((d, i) => {
          const x = (i / divisor) * 360;
          const rake = Number(d.rake) || 0;
          const y = height - (rake / max) * (height - 40) - 20;
          return (
            <circle
              key={"rake-" + i}
              cx={Number.isFinite(x) ? x : 0}
              cy={Number.isFinite(y) ? y : height / 2}
              r="3.5"
              fill="#ffffff"
              stroke="#0F527E"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Date & Volume Axis Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)", paddingTop: "6px" }}>
        {safeData.map((d, i) => (
          <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text-dark)" }}>{d.date}</span>
            <span style={{ fontSize: "10px", color: "#D97706", fontWeight: 700 }}>₹{Math.round(d.gmv).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
