import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { KPICard } from '../../../components/super-admin/KPICard';
import {
  RevenueAreaChart,
  ConversionFunnelChart,
  HorizontalBarChart
} from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ExportIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/useToast';
import { formatCurrency } from '../../../utils/format';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchAnalytics } from '../../../store/admin/adminSlice';
import { selectAnalyticsByRange, selectAnalyticsRequest } from '../../../store/admin/selectors';
import type { CategoryDemand } from '../../../store/admin/types';

/**
 * @file AdminAnalytics.tsx
 * @description
 * Deep-dive business intelligence and financial metrics for the GigsForGigs platform.
 * 100% selector-driven from Redux store (`adminSlice`).
 */

const CATEGORY_PALETTE = ['#0D568D', '#D97706', '#519e8a', '#1E40AF', '#7E22CE'];

export const AdminAnalytics: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');

  const analyticsData = useAppSelector((state) => selectAnalyticsByRange(state, timeRange));
  const analyticsRequest = useAppSelector(selectAnalyticsRequest);

  useEffect(() => {
    void dispatch(fetchAnalytics(timeRange));
  }, [dispatch, timeRange]);

  const categoryColumns: ColumnDef<CategoryDemand>[] = [
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Settled Contracts',
      cell: (row) => <span style={{ fontWeight: 600 }}>{row.contracts}</span>
    },
    {
      header: 'Total Volume',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{formatCurrency(Number(row.totalVolume ?? 0))}</span>
    },
    {
      header: 'Average Order Value',
      cell: (row) => <span>{formatCurrency(Number(row.avgContractValue ?? 0))}</span>
    },
    {
      header: 'Market Share (% GMV)',
      cell: (row) => (
        <span style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>
          {row.marketShare}%
        </span>
      )
    }
  ];

  const rawVelocity = analyticsData?.velocity;
  const velocity = Array.isArray(rawVelocity) ? rawVelocity : [];
  const categories: CategoryDemand[] = Array.isArray(analyticsData?.categories) ? analyticsData.categories : [];
  const funnel = analyticsData?.funnel;
  const funnelSteps = funnel
    ? [
        { label: 'Posted Tasks', count: funnel.posted, color: '#084875' },
        { label: 'Tasks with Bids', count: funnel.withBids, color: '#0D568D' },
        { label: 'Hired Contracts', count: funnel.hired, color: '#1E40AF' },
        { label: 'Escrow Funded', count: funnel.escrowFunded, color: '#519e8a' },
        { label: 'Completed & Released', count: funnel.released, color: '#059669' }
      ]
    : [];
  const overallConversionPct =
    funnel && funnel.posted > 0 ? `${Math.round((funnel.released / funnel.posted) * 1000) / 10}%` : '—';
  const categoryBarItems = categories.map((cat, idx) => ({
    label: cat.category,
    count: cat.totalVolume,
    color: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
    valueText: formatCurrency(cat.totalVolume),
    sharePct: cat.marketShare,
    subText: `${cat.contracts} settled ${cat.contracts === 1 ? 'contract' : 'contracts'} · ${cat.marketShare}% GMV share`
  }));

  /** Download what's on screen. CSV is a pure utility over selected Redux state. */
  const handleExport = (format: 'CSV' | 'JSON') => {
    if (!analyticsData) return;
    const csvCell = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`;
    const content = format === 'JSON'
      ? JSON.stringify(analyticsData, null, 2)
      : [
          'period,gmv,rake',
          ...velocity.map((v: { date: string; gmv: number; rake: number }) => [csvCell(v.date), v.gmv, v.rake].join(',')),
          '',
          'category,contracts,volume,avg_contract_value,market_share_percent',
          ...categories.map((c) => [csvCell(c.category), c.contracts, c.totalVolume, c.avgContractValue, c.marketShare].join(','))
        ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: format === 'JSON' ? 'application/json' : 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gigsforgigs-analytics-${timeRange}.${format.toLowerCase()}`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Report Exported', `Generated ${format} report for ${timeRange.toUpperCase()}.`);
  };

  if (analyticsRequest.status === 'loading' && !analyticsData) {
    return <Loader label="Loading marketplace intelligence..." />;
  }

  if (analyticsRequest.status === 'failed' && !analyticsData) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {analyticsRequest.error || 'Failed to load analytics.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Time Range Filter & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
          {(['7d', '30d', '90d', 'ytd'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: timeRange === range ? 'var(--color-primary-dark)' : 'transparent',
                color: timeRange === range ? '#ffffff' : 'var(--color-text-dark)',
                fontWeight: 600,
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={() => handleExport('CSV')}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExportIcon size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('JSON')}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExportIcon size={16} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Tiles (Dynamically fed from Redux analyticsData) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Gross Volume"
          value={formatCurrency(Number(analyticsData?.grossVolume ?? 0))}
          subtitle={`Released in the last ${timeRange.toUpperCase()}`}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Effective Take Rate"
          value={analyticsData?.grossVolume ? `${((analyticsData.platformRake / analyticsData.grossVolume) * 100).toFixed(1)}%` : '—'}
          subtitle="Rake as a share of gross volume"
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Avg Contract Value"
          value={analyticsData?.avgContractValue == null ? '—' : formatCurrency(analyticsData.avgContractValue)}
          subtitle="Across contracts settled in this range"
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Repeat Client Rate"
          value={analyticsData?.repeatClientRate == null ? '—' : `${analyticsData.repeatClientRate}%`}
          subtitle="All-time: clients with 2+ tasks"
          accentColor="var(--color-text-dark)"
        />
      </div>

      {/* Revenue Velocity Chart */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
            Revenue Velocity (GMV vs Platform Rake)
          </h3>
          {analyticsData?.peak && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Peak: {analyticsData.peak.date} ({formatCurrency(analyticsData.peak.gmv)})
            </span>
          )}
        </div>
        <RevenueAreaChart data={velocity} />
      </div>

      {/* Marketplace Funnel & Category GMV Share */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                Marketplace Conversion Funnel
              </h3>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Tasks created in {timeRange.toUpperCase()} window progressing to release
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              End-to-End: {overallConversionPct}
            </span>
          </div>
          <ConversionFunnelChart steps={funnelSteps} />
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                Category GMV Share
              </h3>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Settled escrow volume distribution across categories
              </span>
            </div>
          </div>
          <HorizontalBarChart data={categoryBarItems} />
        </div>
      </div>

      {/* Category Performance */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
            Skill Categories Breakdown
          </h3>
        </div>
        <DataTable
          data={categories}
          columns={categoryColumns}
          pageSize={5}
          searchPlaceholder="Filter categories..."
        />
      </div>
    </div>
  );
};

export default AdminAnalytics;
