import React from 'react';

/**
 * @file SimpleCharts.tsx
 * @description
 * High-performance, zero-dependency data visualization components.
 * Renders Donut, Horizontal Bar, and Period Financial Volume columns with direct numbers (no hover required).
 */

// ── 1. Donut Chart ──────────────────────────────────────────────────────────
export interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

export const DonutChart: React.FC<{ data: DonutSegment[]; size?: number }> = ({ data, size = 180 }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const radius = size * 0.38;
  const center = size / 2;
  const strokeWidth = size * 0.16;

  // Purely pre-calculate segment geometry without mutating variables during render
  const computedSegments = data.reduce<Array<{ seg: DonutSegment; strokeDasharray: string; strokeDashoffset: number; angle: number }>>(
    (acc, seg) => {
      const percentage = total > 0 ? seg.count / total : 0;
      const currentAngle = acc.length > 0 ? acc[acc.length - 1].angle : 0;
      acc.push({
        seg,
        strokeDasharray: `${percentage * 2 * Math.PI * radius} ${2 * Math.PI * radius}`,
        strokeDashoffset: -currentAngle * 2 * Math.PI * radius,
        angle: currentAngle + percentage,
      });
      return acc;
    },
    []
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-bg-light)" strokeWidth={strokeWidth} />
        {computedSegments.map(({ seg, strokeDasharray, strokeDashoffset }, idx) => (
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
        ))}
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

// ── 3. Revenue Velocity Chart (Clean SaaS Column Visualization) ──────────────
export interface RevenuePoint {
  date: string;
  gmv: number;
  rake: number;
}

export const RevenueAreaChart: React.FC<{ data?: RevenuePoint[]; height?: number }> = ({
  data = [],
  height = 180
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-light)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-xs)'
        }}
      >
        No transaction records found for this time window.
      </div>
    );
  }

  const safeData = data;
  const maxGmv = Math.max(1, ...safeData.map((d) => Number(d.gmv) || 0));
  // Round up max to a clean ceiling (e.g. 30.7L -> 35L)
  const yMax = maxGmv > 0 ? Math.ceil(maxGmv * 1.15) : 100000;

  const totalGmv = safeData.reduce((sum, d) => sum + (Number(d.gmv) || 0), 0);
  const totalRake = safeData.reduce((sum, d) => sum + (Number(d.rake) || 0), 0);
  const totalPayout = Math.max(0, totalGmv - totalRake);
  const effectiveRakePct = totalGmv > 0 ? ((totalRake / totalGmv) * 100).toFixed(1) : '0.0';

  // Compact Indian Currency Formatter (e.g., ₹30.7L, ₹2.2k, ₹0)
  const formatCompact = (val: number): string => {
    if (!val || val <= 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // SVG Coordinate Geometry
  const svgWidth = 720;
  const svgHeight = 160;
  const chartTop = 16;
  const chartBottom = 125;
  const chartHeight = chartBottom - chartTop; // 109px
  const yAxisLabelX = 52;
  const plotLeft = 64;
  const plotRight = 705;
  const plotWidth = plotRight - plotLeft;
  const count = safeData.length;
  const slotWidth = count > 0 ? plotWidth / count : plotWidth;

  // Horizontal reference lines (0%, 50%, 100%)
  const gridLines = [
    { value: yMax, y: chartTop, label: formatCompact(yMax) },
    { value: yMax / 2, y: chartTop + chartHeight / 2, label: formatCompact(yMax / 2) },
    { value: 0, y: chartBottom, label: '₹0' }
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Legend & Period Context Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: 'var(--font-size-xs)'
        }}
      >
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Escrow Settlement Volume vs Retained Platform Take
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#D97706' }} />
            <span style={{ color: 'var(--color-text-dark)', fontWeight: 600 }}>Gross Volume (GMV)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#0D568D' }} />
            <span style={{ color: 'var(--color-text-dark)', fontWeight: 600 }}>Platform Rake</span>
          </div>
        </div>
      </div>

      {/* SVG Proportional Financial Column Chart */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '12px 14px 4px 6px',
          overflowX: 'auto'
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
        >
          {/* Subtle Gridlines */}
          {gridLines.map((gl, idx) => (
            <g key={idx}>
              <line
                x1={plotLeft}
                y1={gl.y}
                x2={plotRight}
                y2={gl.y}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={yAxisLabelX}
                y={gl.y + 3}
                textAnchor="end"
                fontSize="10"
                fontWeight="500"
                fill="#64748B"
              >
                {gl.label}
              </text>
            </g>
          ))}

          {/* Columns per Date Bucket */}
          {safeData.map((d, i) => {
            const gmv = Number(d.gmv) || 0;
            const rake = Number(d.rake) || 0;
            const cx = plotLeft + i * slotWidth + slotWidth / 2;
            const trackWidth = Math.min(68, slotWidth * 0.72);
            const trackLeft = cx - trackWidth / 2;

            // Bar dimensions
            const barWidth = Math.min(22, (trackWidth - 10) / 2);
            const gmvHeight = gmv > 0 ? Math.max(6, (gmv / yMax) * chartHeight) : 0;
            const rakeHeight = rake > 0 ? Math.max(4, (rake / yMax) * chartHeight) : 0;

            const gmvX = cx - barWidth - 2;
            const rakeX = cx + 2;
            const gmvY = chartBottom - gmvHeight;
            const rakeY = chartBottom - rakeHeight;

            return (
              <g key={i}>
                {/* Subtle Column Slot Container */}
                <rect
                  x={trackLeft}
                  y={chartTop}
                  width={trackWidth}
                  height={chartHeight}
                  rx="6"
                  fill="rgba(13, 86, 141, 0.03)"
                />

                {/* If Zero Volume: Crisp Baseline Indicator */}
                {gmv === 0 ? (
                  <rect
                    x={trackLeft + 6}
                    y={chartBottom - 2}
                    width={trackWidth - 12}
                    height="2"
                    rx="1"
                    fill="#CBD5E1"
                  />
                ) : (
                  <>
                    {/* GMV Bar (Amber) */}
                    <rect
                      x={gmvX}
                      y={gmvY}
                      width={barWidth}
                      height={gmvHeight}
                      rx="3"
                      fill="#D97706"
                    />

                    {/* Platform Rake Bar (Navy) */}
                    <rect
                      x={rakeX}
                      y={rakeY}
                      width={barWidth}
                      height={rakeHeight}
                      rx="3"
                      fill="#0D568D"
                    />

                    {/* Compact Label Above GMV Bar */}
                    <text
                      x={gmvX + barWidth / 2}
                      y={Math.max(chartTop + 10, gmvY - 4)}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#B45F00"
                    >
                      {formatCompact(gmv)}
                    </text>
                    {/* Compact Label Above Platform Rake Bar */}
                    {rake > 0 && (
                      <text
                        x={rakeX + barWidth / 2}
                        y={Math.max(chartTop + 10, rakeY - 4)}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill="#0D568D"
                      >
                        {formatCompact(rake)}
                      </text>
                    )}

                  </>
                )}

                {/* Date Label on X-Axis */}
                <text
                  x={cx}
                  y={chartBottom + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={gmv > 0 ? '700' : '500'}
                  fill={gmv > 0 ? 'var(--color-text-dark)' : 'var(--color-text-muted)'}
                >
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Executive Financial Summary Cards (No Hover Required) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid #D97706',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gross Escrow Volume (GMV)
          </span>
          <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
            ₹{Math.round(totalGmv).toLocaleString('en-IN')}
          </strong>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid #0D568D',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Rake
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D568D', backgroundColor: 'rgba(13, 86, 141, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
              {effectiveRakePct}% take
            </span>
          </div>
          <strong style={{ fontSize: '16px', fontWeight: 800, color: '#0D568D' }}>
            ₹{Math.round(totalRake).toLocaleString('en-IN')}
          </strong>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid #059669',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Freelancer Net Payout
          </span>
          <strong style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>
            ₹{Math.round(totalPayout).toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </div>
  );
};
