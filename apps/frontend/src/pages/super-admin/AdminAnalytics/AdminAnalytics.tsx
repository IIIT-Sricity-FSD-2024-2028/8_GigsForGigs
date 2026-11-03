import React, { useState, useEffect } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { RevenueAreaChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ExportIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

/**
 * @file AdminAnalytics.tsx
 * @description
 * Deep-dive business intelligence and financial metrics for the GigsForGigs platform.
 * Fetches cohort analysis, category demand distribution, and dataset export tools directly from the backend API.
 */

interface CategoryDemand {
  category: string;
  contracts: number;
  totalVolume: number;
  avgContractValue: number;
  marketShare: number;
}

export const AdminAnalytics: React.FC = () => {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        const data = await adminApi.getAnalytics(timeRange);
        if (isMounted) {
          setAnalyticsData(data);
          setLoadError(null);
        }
      } catch (err: any) {
        if (isMounted) setLoadError(err?.message || 'Failed to load analytics.');
      }
    }
    loadAnalytics();
    return () => { isMounted = false; };
  }, [timeRange]);

  const categoryColumns: ColumnDef<CategoryDemand>[] = [
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Settled Contracts',
      cell: (row) => <span style={{ fontWeight: 600 }}>{row.contracts}</span>
    },
    {
      header: 'Total Volume',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>₹{Number(row.totalVolume ?? 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Average Order Value',
      cell: (row) => <span>₹{Number(row.avgContractValue ?? 0).toLocaleString('en-IN')}</span>
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

  /** Download what's on screen. CSV is one row per time bucket, then one per category. */
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

  const rawVelocity = analyticsData?.velocity;
  const velocity = Array.isArray(rawVelocity) ? rawVelocity : [];

  const categories: CategoryDemand[] = Array.isArray(analyticsData?.categories) ? analyticsData.categories : [];

  if (loadError) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {loadError}
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

      {/* Analytics KPI Metric Tiles (100% Dynamically Fed from DB & Time Range) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Gross Volume"
          value={`₹${Number(analyticsData?.grossVolume ?? 0).toLocaleString('en-IN')}`}
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
          value={analyticsData?.avgContractValue == null ? '—' : `₹${analyticsData.avgContractValue.toLocaleString('en-IN')}`}
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
              Peak: {analyticsData.peak.date} (₹{analyticsData.peak.gmv.toLocaleString('en-IN')})
            </span>
          )}
        </div>
        <RevenueAreaChart data={velocity} />
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
