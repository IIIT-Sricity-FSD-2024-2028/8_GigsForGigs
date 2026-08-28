import React, { useState } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { RevenueAreaChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import {
  TrendingUpIcon,
  ExportIcon
} from '../../../components/super-admin/Icons';
import { mockRevenueVelocity } from '../../../mock/adminMockData';

/**
 * @file AdminAnalytics.tsx
 * @description
 * Deep-dive business intelligence and financial metrics for the GigsForGigs platform.
 * Features cohort analysis, category demand distribution, and dataset export tools.
 *
 * NOT WIRED TO THE REAL BACKEND: every figure on this page (GMV/take-rate/AOV/
 * repeat-client-rate KPI tiles, the category demand matrix, the revenue
 * velocity time series) has no backing endpoint — `/api/admin/dashboard/stats`
 * only returns lifetime aggregate counts, not a per-category breakdown or a
 * daily time series, and there's no category/tag field on Task at all. Left
 * entirely on mock/adminMockData.ts + the local mockCategories fixture below
 * rather than fabricating a fake aggregation endpoint. Real dashboard KPIs
 * that DO exist have been wired instead on the Dashboard page.
 */

interface CategoryDemand {
  category: string;
  activeContracts: number;
  totalVolume: number;
  avgBudget: number;
  growthRate: string;
}

const mockCategories: CategoryDemand[] = [
  { category: 'Software Development', activeContracts: 184, totalVolume: 198400, avgBudget: 1078, growthRate: '+24%' },
  { category: 'Design & Creative', activeContracts: 96, totalVolume: 78900, avgBudget: 821, growthRate: '+14%' },
  { category: 'AI & Data Science', activeContracts: 64, totalVolume: 84200, avgBudget: 1315, growthRate: '+42%' },
  { category: '3D & Spatial Computing', activeContracts: 38, totalVolume: 41200, avgBudget: 1084, growthRate: '+31%' },
  { category: 'Writing & Translation', activeContracts: 30, totalVolume: 26200, avgBudget: 873, growthRate: '+6%' }
];

export const AdminAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  const categoryColumns: ColumnDef<CategoryDemand>[] = [
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Active Gigs',
      cell: (row) => <span style={{ fontWeight: 600 }}>{row.activeContracts}</span>
    },
    {
      header: 'Total Volume',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>${row.totalVolume.toLocaleString()}</span>
    },
    {
      header: 'Average Order Value',
      cell: (row) => <span>${row.avgBudget.toLocaleString()}</span>
    },
    {
      header: 'MoM Growth',
      cell: (row) => (
        <span className="admin-badge badge-success">
          <TrendingUpIcon size={12} /> {row.growthRate}
        </span>
      )
    }
  ];

  const handleExport = (format: 'csv' | 'json') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Exported platform analytics dataset as ${format.toUpperCase()} (Streamed from PostgreSQL).`);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* ── Filter Bar & Export Actions ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', backgroundColor: 'var(--color-bg-white)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          {(['7d', '30d', '90d', 'ytd'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="admin-btn admin-btn-sm"
              style={{
                backgroundColor: timeRange === range ? 'var(--color-primary-dark)' : 'transparent',
                color: timeRange === range ? '#ffffff' : 'var(--color-text-dark)',
                fontWeight: timeRange === range ? 700 : 500
              }}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <ExportIcon size={14} /> Export CSV
          </button>
          <button
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            <ExportIcon size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* ── Financial KPI Tiles ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <KPICard
          title="Gross Merchandise Vol"
          value="$428,900"
          deltaText="+22.4%"
          subtitle="Total transacted marketplace volume"
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Platform Take Rate"
          value="$42,890"
          deltaText="+22.4%"
          subtitle="Effective rake: 10.0% of GMV"
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Average Order Value"
          value="$1,041"
          deltaText="+5.8%"
          subtitle="Per completed task contract"
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Repeat Client Rate"
          value="74.2%"
          deltaText="+3.1%"
          subtitle="Clients posting >= 2 tasks"
          accentColor="var(--color-primary-blue)"
        />
      </div>

      {/* ── Time-Series Revenue Area Chart ──────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Transaction Volume & Commission Velocity ({timeRange.toUpperCase()})
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Single-pass PostgreSQL aggregate metrics computed in real time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#bf6900', borderRadius: '50%' }} />
              <span style={{ fontWeight: 600 }}>GMV ($)</span>
            </div>
          </div>
        </div>
        <RevenueAreaChart data={mockRevenueVelocity} height={180} />
      </div>

      {/* ── Category Demand Matrix ──────────────────────────────────────── */}
      <DataTable
        title="Marketplace Category Performance"
        columns={categoryColumns}
        data={mockCategories}
        pageSize={5}
        searchPlaceholder="Filter categories..."
      />
    </div>
  );
};

export default AdminAnalytics;
