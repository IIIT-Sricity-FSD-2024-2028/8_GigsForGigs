import React, { useState } from 'react';
import { formatCurrency } from '../../utils/format';

/**
 * @file SimpleCharts.tsx
 * @description
 * Zero-dependency interactive data visualization components for Super Admin:
 * Donut with hover focus + share percentages, Horizontal/Category Bar Chart,
 * Revenue Velocity Chart with hover tooltips & Take-Rate trend toggle,
 * and Marketplace Conversion Funnel.
 */

function formatCompactInr(val: number): string {
  if (!val || val <= 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return formatCurrency(val);
}

// ── 1. Donut Chart ──────────────────────────────────────────────────────────
export interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

export const DonutChart: React.FC<{ data: DonutSegment[]; size?: number }> = ({ data, size = 180 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const radius = size * 0.38;
  const center = size / 2;
  const strokeWidth = size * 0.16;

  // Purely pre-calculate segment geometry without mutating variables during render
  const computedSegments = data.reduce<
    Array<{ seg: DonutSegment; pct: string; strokeDasharray: string; strokeDashoffset: number; angle: number }>
  >((acc, seg) => {
    const ratio = total > 0 ? seg.count / total : 0;
    const currentAngle = acc.length > 0 ? acc[acc.length - 1].angle : 0;
    acc.push({
      seg,
      pct: total > 0 ? `${(ratio * 100).toFixed(1)}%` : '0.0%',
      strokeDasharray: `${ratio * 2 * Math.PI * radius} ${2 * Math.PI * radius}`,
      strokeDashoffset: -currentAngle * 2 * Math.PI * radius,
      angle: currentAngle + ratio,
    });
    return acc;
  }, []);

  const hoveredItem = hoveredIndex !== null ? computedSegments[hoveredIndex] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-bg-light)" strokeWidth={strokeWidth} />
        {computedSegments.map(({ seg, strokeDasharray, strokeDashoffset }, idx) => {
          const isHovered = hoveredIndex === idx;
          const isDimmed = hoveredIndex !== null && !isHovered;
          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                opacity: isDimmed ? 0.35 : 1,
                cursor: 'pointer',
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
              }}
            />
          );
        })}
        <text x={center} y={center + 2} textAnchor="middle" fontSize={size * 0.14} fontWeight="700" fill="var(--color-text-dark)">
          {hoveredItem ? hoveredItem.seg.count : total}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--color-text-muted)">
          {hoveredItem ? hoveredItem.pct : 'Total Tasks'}
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '170px', flex: 1 }}>
        {computedSegments.map(({ seg, pct }, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isHovered ? 'rgba(8, 75, 131, 0.06)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0 }} />
                <span style={{ color: isHovered ? 'var(--color-primary-dark)' : 'var(--color-text-muted)', fontWeight: isHovered ? 700 : 500 }}>
                  {seg.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{seg.count}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-bg-light)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  {pct}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 2. Simple Bar Chart ─────────────────────────────────────────────────────
export interface BarItem {
  label: string;
  count: number;
  color: string;
  valueText?: string;
  subText?: string;
  sharePct?: number;
}

export const HorizontalBarChart: React.FC<{ data: BarItem[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
        No category data available for this range.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', width: '100%' }}>
      {data.map((item, idx) => {
        const percent = item.sharePct !== undefined ? Math.min(100, Math.max(0, item.sharePct)) : Math.round((item.count / max) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
              <span style={{ color: 'var(--color-text-dark)' }}>{item.label}</span>
              <span style={{ color: 'var(--color-text-dark)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {item.valueText ?? item.count.toLocaleString()}
              </span>
            </div>
            <div style={{ height: '10px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${item.count > 0 ? Math.max(3, percent) : 0}%`,
                  backgroundColor: item.color,
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            {item.subText && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {item.subText}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── 3. Marketplace Conversion Funnel Chart ──────────────────────────────────
export interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export const ConversionFunnelChart: React.FC<{ steps: FunnelStep[] }> = ({ steps }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const topCount = steps[0]?.count ?? 0;

  if (steps.length === 0 || topCount === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg-light)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        No posted tasks recorded inside this time window.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {steps.map((step, idx) => {
        const prevCount = idx > 0 ? steps[idx - 1].count : step.count;
        const totalShare = topCount > 0 ? Math.round((step.count / topCount) * 1000) / 10 : 0;
        const stepRate = idx > 0 && prevCount > 0 ? Math.round((step.count / prevCount) * 1000) / 10 : null;
        const widthPct = topCount > 0 && step.count > 0 ? Math.max(8, (step.count / topCount) * 100) : 0;
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={step.label}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isHovered ? 'rgba(8, 75, 131, 0.04)' : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: 'var(--font-size-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: step.color,
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{step.label}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {stepRate !== null && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {stepRate}% from prev
                  </span>
                )}
                <span style={{ fontWeight: 800, color: 'var(--color-text-dark)' }}>{step.count}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: step.color,
                    backgroundColor: 'var(--color-bg-light)',
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {totalShare}%
                </span>
              </div>
            </div>

            <div style={{ height: '10px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${widthPct}%`,
                  backgroundColor: step.color,
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.35s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── 4. Revenue Velocity Chart (Synchronized Dual-Band Area + Take Rate) ───
export interface RevenuePoint {
  date: string;
  gmv: number;
  rake: number;
}

function buildSmoothLinePath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;
  return coords
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      const prev = coords[i - 1];
      const midX = (prev.x + pt.x) / 2;
      return `C ${midX},${prev.y} ${midX},${pt.y} ${pt.x},${pt.y}`;
    })
    .join(' ');
}

function buildSmoothAreaPath(coords: Array<{ x: number; y: number }>, baselineY: number): string {
  if (coords.length === 0) return '';
  const line = buildSmoothLinePath(coords);
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${line} L ${last.x},${baselineY} L ${first.x},${baselineY} Z`;
}

export const RevenueAreaChart: React.FC<{ data?: RevenuePoint[]; height?: number }> = ({
  data = [],
  height = 240,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'splitArea' | 'stackedBars' | 'takeRate'>('splitArea');

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
          fontSize: 'var(--font-size-xs)',
        }}
      >
        No transaction records found for this time window.
      </div>
    );
  }

  const safeData = data;
  const count = safeData.length;
  const maxGmv = Math.max(1, ...safeData.map((d) => Number(d.gmv) || 0));
  const yMaxGmv = maxGmv > 0 ? Math.ceil(maxGmv * 1.2) : 100000;

  const maxRake = Math.max(1, ...safeData.map((d) => Number(d.rake) || 0));
  const yMaxRake = maxRake > 0 ? Math.ceil(maxRake * 1.22) : 10000;

  const takeRates = safeData.map((d) => {
    const gmv = Number(d.gmv) || 0;
    const rake = Number(d.rake) || 0;
    return gmv > 0 ? Math.round((rake / gmv) * 1000) / 10 : 0;
  });
  const maxRate = Math.max(15, ...takeRates);
  const yMaxRate = Math.ceil(maxRate * 1.25);

  const totalGmv = safeData.reduce((sum, d) => sum + (Number(d.gmv) || 0), 0);
  const totalRake = safeData.reduce((sum, d) => sum + (Number(d.rake) || 0), 0);
  const totalPayout = Math.max(0, totalGmv - totalRake);
  const effectiveRakePct = totalGmv > 0 ? ((totalRake / totalGmv) * 100).toFixed(1) : '0.0';

  // Shared SVG Geometry
  const svgWidth = 740;
  const plotLeft = 66;
  const plotRight = 716;
  const plotWidth = plotRight - plotLeft;
  const slotWidth = count > 0 ? plotWidth / count : plotWidth;
  const xAt = (i: number) => plotLeft + i * slotWidth + slotWidth / 2;

  // Geometry for Split Dual-Band Mode (Top GMV band + Bottom Platform Rake band)
  const splitSvgHeight = 258;
  const gmvTop = 26;
  const gmvBottom = 122;
  const gmvBandHeight = gmvBottom - gmvTop;

  const rakeTop = 148;
  const rakeBottom = 228;
  const rakeBandHeight = rakeBottom - rakeTop;
  const splitXAxisY = 248;

  // Geometry for Single-Canvas Modes (Stacked Bars & Take Rate %)
  const singleSvgHeight = 216;
  const singleTop = 24;
  const singleBottom = 182;
  const singleHeight = singleBottom - singleTop;
  const singleXAxisY = 204;

  const gmvCoords = safeData.map((d, i) => {
    const gmv = Number(d.gmv) || 0;
    return { x: xAt(i), y: gmvBottom - (gmv / yMaxGmv) * gmvBandHeight, val: gmv };
  });

  const rakeCoords = safeData.map((d, i) => {
    const rake = Number(d.rake) || 0;
    return { x: xAt(i), y: rakeBottom - (rake / yMaxRake) * rakeBandHeight, val: rake };
  });

  const rateCoords = safeData.map((_, i) => {
    const pct = takeRates[i];
    return { x: xAt(i), y: singleBottom - (pct / yMaxRate) * singleHeight, pct };
  });

  const hoveredPoint = hoveredIdx !== null ? safeData[hoveredIdx] : null;
  const hoveredGmv = hoveredPoint ? Number(hoveredPoint.gmv) || 0 : 0;
  const hoveredRake = hoveredPoint ? Number(hoveredPoint.rake) || 0 : 0;
  const hoveredPayout = Math.max(0, hoveredGmv - hoveredRake);
  const hoveredPct = hoveredGmv > 0 ? ((hoveredRake / hoveredGmv) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Header Controls: Mode Tabs + Legend / Active Bucket Inspector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {chartMode === 'splitArea' && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                <span style={{ width: '10px', height: '3px', borderRadius: '2px', backgroundColor: '#D97706' }} />
                Gross Volume (GMV)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                <span style={{ width: '10px', height: '3px', borderRadius: '2px', backgroundColor: '#0D568D' }} />
                Platform Rake (Dedicated Scale)
              </span>
            </>
          )}
          {chartMode === 'stackedBars' && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10B981' }} />
                Freelancer Payout
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#084875' }} />
                Platform Rake
              </span>
            </>
          )}
          {chartMode === 'takeRate' && (
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Effective Platform Take Rate (%) Across Buckets
            </span>
          )}
        </div>

        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--color-bg-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          {(
            [
              { id: 'splitArea', label: 'Dual Curves' },
              { id: 'stackedBars', label: 'Stacked GMV' },
              { id: 'takeRate', label: 'Take Rate %' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setChartMode(mode.id)}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: chartMode === mode.id ? 'var(--color-primary-dark)' : 'transparent',
                color: chartMode === mode.id ? '#ffffff' : 'var(--color-text-dark)',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Bucket Telemetry Strip (Pinned cleanly above chart, never occludes curves) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '8px 14px',
          backgroundColor: hoveredPoint ? 'rgba(8, 75, 131, 0.06)' : 'var(--color-bg-light)',
          border: `1px solid ${hoveredPoint ? 'rgba(8, 75, 131, 0.25)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          transition: 'all 0.15s ease',
        }}
      >
        {hoveredPoint ? (
          <>
            <strong style={{ color: 'var(--color-primary-dark)' }}>{hoveredPoint.date}</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <span>
                <span style={{ color: 'var(--color-text-muted)' }}>GMV: </span>
                <strong style={{ color: '#B45F00' }}>{formatCurrency(hoveredGmv)}</strong>
              </span>
              <span>
                <span style={{ color: 'var(--color-text-muted)' }}>Rake: </span>
                <strong style={{ color: '#0D568D' }}>{formatCurrency(hoveredRake)}</strong>
              </span>
              <span>
                <span style={{ color: 'var(--color-text-muted)' }}>Pro Payout: </span>
                <strong style={{ color: '#059669' }}>{formatCurrency(hoveredPayout)}</strong>
              </span>
              <span>
                <span style={{ color: 'var(--color-text-muted)' }}>Take: </span>
                <strong style={{ color: 'var(--color-text-dark)' }}>{hoveredPct}%</strong>
              </span>
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>
            Hover any time bucket on the chart below to inspect exact settlement totals & payout split.
          </span>
        )}
      </div>

      {/* Chart SVG Frame */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '10px 14px 6px 8px',
          overflowX: 'auto',
        }}
      >
        {chartMode === 'splitArea' ? (
          <svg viewBox={`0 0 ${svgWidth} ${splitSvgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '500px', display: 'block' }}>
            <defs>
              <linearGradient id="gmvAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="rakeAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D568D" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#0D568D" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Top Track (GMV) Gridlines & Section Tag */}
            <text x={plotLeft} y={13} fontSize="9.5" fontWeight="700" fill="#B45F00" letterSpacing="0.04em">
              GROSS VOLUME (GMV)
            </text>
            {[
              { y: gmvTop, label: formatCompactInr(yMaxGmv) },
              { y: gmvTop + gmvBandHeight / 2, label: formatCompactInr(yMaxGmv / 2) },
              { y: gmvBottom, label: '₹0' },
            ].map((gl, idx) => (
              <g key={`gmv-grid-${idx}`}>
                <line x1={plotLeft} y1={gl.y} x2={plotRight} y2={gl.y} stroke={idx === 2 ? '#CBD5E1' : '#EEF2F6'} strokeDasharray={idx === 2 ? undefined : '4 4'} strokeWidth="1" />
                <text x={plotLeft - 10} y={gl.y + 3} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#94A3B8">
                  {gl.label}
                </text>
              </g>
            ))}

            {/* Bottom Track (Platform Rake) Gridlines & Section Tag */}
            <text x={plotLeft} y={rakeTop - 7} fontSize="9.5" fontWeight="700" fill="#0D568D" letterSpacing="0.04em">
              PLATFORM RAKE (INDEPENDENT SCALE)
            </text>
            {[
              { y: rakeTop, label: formatCompactInr(yMaxRake) },
              { y: rakeTop + rakeBandHeight / 2, label: formatCompactInr(yMaxRake / 2) },
              { y: rakeBottom, label: '₹0' },
            ].map((gl, idx) => (
              <g key={`rake-grid-${idx}`}>
                <line x1={plotLeft} y1={gl.y} x2={plotRight} y2={gl.y} stroke={idx === 2 ? '#CBD5E1' : '#EEF2F6'} strokeDasharray={idx === 2 ? undefined : '4 4'} strokeWidth="1" />
                <text x={plotLeft - 10} y={gl.y + 3} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#94A3B8">
                  {gl.label}
                </text>
              </g>
            ))}

            {/* GMV Smooth Area + Curve */}
            <path d={buildSmoothAreaPath(gmvCoords, gmvBottom)} fill="url(#gmvAreaFill)" />
            <path d={buildSmoothLinePath(gmvCoords)} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Platform Rake Smooth Area + Curve */}
            <path d={buildSmoothAreaPath(rakeCoords, rakeBottom)} fill="url(#rakeAreaFill)" />
            <path d={buildSmoothLinePath(rakeCoords)} fill="none" stroke="#0D568D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Interactive Crosshair Slots & Data Points */}
            {safeData.map((d, i) => {
              const cx = xAt(i);
              const gp = gmvCoords[i];
              const rp = rakeCoords[i];
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Transparent full-height hover column */}
                  <rect x={cx - slotWidth / 2} y={gmvTop - 6} width={slotWidth} height={splitXAxisY - gmvTop} fill="transparent" />

                  {/* Vertical focus crosshair */}
                  {isHovered && (
                    <line x1={cx} y1={gmvTop - 4} x2={cx} y2={rakeBottom} stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1" />
                  )}

                  {/* GMV Node + Value Tag */}
                  <circle
                    cx={gp.x}
                    cy={gp.y}
                    r={isHovered ? 5.5 : gp.val > 0 ? 4 : 2.5}
                    fill={gp.val > 0 ? '#D97706' : '#CBD5E1'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {gp.val > 0 && (
                    <text x={gp.x} y={Math.max(gmvTop + 2, gp.y - 9)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#B45F00">
                      {formatCompactInr(gp.val)}
                    </text>
                  )}

                  {/* Rake Node + Value Tag */}
                  <circle
                    cx={rp.x}
                    cy={rp.y}
                    r={isHovered ? 5.5 : rp.val > 0 ? 4 : 2.5}
                    fill={rp.val > 0 ? '#0D568D' : '#CBD5E1'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {rp.val > 0 && (
                    <text x={rp.x} y={Math.max(rakeTop + 2, rp.y - 9)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#084875">
                      {formatCompactInr(rp.val)}
                    </text>
                  )}

                  {/* Shared X-Axis Period Label */}
                  <text
                    x={cx}
                    y={splitXAxisY}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered || gp.val > 0 ? '700' : '500'}
                    fill={isHovered ? '#084875' : gp.val > 0 ? 'var(--color-text-dark)' : '#94A3B8'}
                  >
                    {d.date}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : chartMode === 'stackedBars' ? (
          <svg viewBox={`0 0 ${svgWidth} ${singleSvgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '500px', display: 'block' }}>
            <defs>
              <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="rakeCapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D568D" />
                <stop offset="100%" stopColor="#084875" />
              </linearGradient>
            </defs>

            {[
              { y: singleTop, label: formatCompactInr(yMaxGmv) },
              { y: singleTop + singleHeight / 2, label: formatCompactInr(yMaxGmv / 2) },
              { y: singleBottom, label: '₹0' },
            ].map((gl, idx) => (
              <g key={idx}>
                <line x1={plotLeft} y1={gl.y} x2={plotRight} y2={gl.y} stroke={idx === 2 ? '#CBD5E1' : '#EEF2F6'} strokeDasharray={idx === 2 ? undefined : '4 4'} strokeWidth="1" />
                <text x={plotLeft - 10} y={gl.y + 3} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#94A3B8">
                  {gl.label}
                </text>
              </g>
            ))}

            {safeData.map((d, i) => {
              const gmv = Number(d.gmv) || 0;
              const rake = Number(d.rake) || 0;
              const cx = xAt(i);
              const barWidth = Math.min(38, slotWidth * 0.48);
              const totalH = gmv > 0 ? Math.max(8, (gmv / yMaxGmv) * singleHeight) : 0;
              const rakeH = gmv > 0 && rake > 0 ? Math.max(4, (rake / gmv) * totalH) : 0;
              const payoutH = Math.max(0, totalH - rakeH);
              const payoutY = singleBottom - payoutH;
              const topY = singleBottom - totalH;
              const isHovered = hoveredIdx === i;
              const isDimmed = hoveredIdx !== null && !isHovered;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', opacity: isDimmed ? 0.45 : 1, transition: 'opacity 0.15s ease' }}
                >
                  <rect x={cx - slotWidth / 2} y={singleTop} width={slotWidth} height={singleXAxisY - singleTop} fill="transparent" />
                  {gmv === 0 ? (
                    <circle cx={cx} cy={singleBottom} r="2.5" fill="#CBD5E1" />
                  ) : (
                    <>
                      <rect x={cx - barWidth / 2} y={payoutY} width={barWidth} height={payoutH} rx="3" fill="url(#payoutGrad)" />
                      <rect x={cx - barWidth / 2} y={topY} width={barWidth} height={rakeH} rx="3" fill="url(#rakeCapGrad)" />
                      <text x={cx} y={Math.max(singleTop + 8, topY - 6)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-dark)">
                        {formatCompactInr(gmv)}
                      </text>
                    </>
                  )}
                  <text
                    x={cx}
                    y={singleXAxisY}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered || gmv > 0 ? '700' : '500'}
                    fill={isHovered ? '#084875' : gmv > 0 ? 'var(--color-text-dark)' : '#94A3B8'}
                  >
                    {d.date}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <svg viewBox={`0 0 ${svgWidth} ${singleSvgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '500px', display: 'block' }}>
            <defs>
              <linearGradient id="rateAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D568D" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0D568D" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[
              { y: singleTop, label: `${yMaxRate}%` },
              { y: singleTop + singleHeight / 2, label: `${Math.round((yMaxRate / 2) * 10) / 10}%` },
              { y: singleBottom, label: '0%' },
            ].map((gl, idx) => (
              <g key={idx}>
                <line x1={plotLeft} y1={gl.y} x2={plotRight} y2={gl.y} stroke={idx === 2 ? '#CBD5E1' : '#EEF2F6'} strokeDasharray={idx === 2 ? undefined : '4 4'} strokeWidth="1" />
                <text x={plotLeft - 10} y={gl.y + 3} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#94A3B8">
                  {gl.label}
                </text>
              </g>
            ))}

            <path d={buildSmoothAreaPath(rateCoords, singleBottom)} fill="url(#rateAreaGrad)" />
            <path d={buildSmoothLinePath(rateCoords)} fill="none" stroke="#0D568D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {safeData.map((d, i) => {
              const pt = rateCoords[i];
              const isHovered = hoveredIdx === i;
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect x={pt.x - slotWidth / 2} y={singleTop} width={slotWidth} height={singleXAxisY - singleTop} fill="transparent" />
                  {isHovered && (
                    <line x1={pt.x} y1={singleTop} x2={pt.x} y2={singleBottom} stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1" />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : pt.pct > 0 ? 4 : 2.5}
                    fill={pt.pct > 0 ? '#0D568D' : '#CBD5E1'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {pt.pct > 0 && (
                    <text x={pt.x} y={Math.max(singleTop + 8, pt.y - 8)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#084875">
                      {pt.pct}%
                    </text>
                  )}
                  <text
                    x={pt.x}
                    y={singleXAxisY}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered || pt.pct > 0 ? '700' : '500'}
                    fill={isHovered ? '#084875' : pt.pct > 0 ? 'var(--color-text-dark)' : '#94A3B8'}
                  >
                    {d.date}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* 3. Executive Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid #D97706',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gross Escrow Volume (GMV)
          </span>
          <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
            {formatCurrency(Math.round(totalGmv))}
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
            gap: '2px',
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
            {formatCurrency(Math.round(totalRake))}
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
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Freelancer Net Payout
          </span>
          <strong style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>
            {formatCurrency(Math.round(totalPayout))}
          </strong>
        </div>
      </div>
    </div>
  );
};
