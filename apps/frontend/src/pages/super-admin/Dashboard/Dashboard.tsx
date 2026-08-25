import React from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DonutChart, HorizontalBarChart, RevenueAreaChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import {
  UsersIcon,
  PaymentIcon,
  ProjectIcon,
  DisputeIcon
} from '../../../components/super-admin/Icons';
import {
  mockKPIs,
  mockTasksByStatus,
  mockUsersByRole,
  mockRevenueVelocity,
  mockRecentUsers,
  mockProjects,
  type UserSummary,
  type PlatformProject
} from '../../../mock/adminMockData';

/**
 * @file Dashboard.tsx
 * @description
 * High-level executive overview for the GigsForGigs platform owner and delegate admins.
 * Displays real-time financial velocity, status distributions, active contracts, and recent registrations.
 */

export interface DashboardProps {
  onNavigate?: (viewId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Column definitions for recent user registrations
  const userColumns: ColumnDef<UserSummary>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Role',
      cell: (row) => <StatusBadge status={row.role} />
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt'
    }
  ];

  // Column definitions for recent platform tasks
  const projectColumns: ColumnDef<PlatformProject>[] = [
    {
      header: 'Task Title',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Client: {row.clientName}</span>
        </div>
      )
    },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.budget.toLocaleString()}</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* ── Operational Dispute Alert Banner ────────────────────────────── */}
      {mockKPIs.pendingDisputes > 0 && (
        <div
          className="admin-card"
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ color: 'var(--color-warning-text)' }}>
              <DisputeIcon size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-warning-text)' }}>
                {mockKPIs.pendingDisputes} Pending Dispute Arbitrations Require Immediate Action
              </h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Client escrow funds are currently frozen pending Super Admin arbitration review.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => onNavigate('disputes')}
            >
              Open Arbitration Court
            </button>
          )}
        </div>
      )}

      {/* ── KPI Metrics Grid ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <KPICard
          title="Platform GMV"
          value={`$${mockKPIs.grossMerchandiseVolume.toLocaleString()}`}
          deltaText="+18.4%"
          subtitle={`Net Rake: $${mockKPIs.platformRevenue.toLocaleString()} (10%)`}
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Active Contracts"
          value={mockKPIs.activeTasks.toLocaleString()}
          deltaText="+7.2%"
          subtitle="412 in-flight deliverables"
          icon={<ProjectIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Total Registered Users"
          value={mockKPIs.totalUsers.toLocaleString()}
          deltaText="+12.0%"
          subtitle="4,210 Clients · 9,640 Gig Pros"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Escrow Held"
          value={`$${mockKPIs.escrowHeld.toLocaleString()}`}
          subtitle="Guaranteed milestone deposits"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
      </div>

      {/* ── Chart Visualizations ────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        {/* Tasks by Status Chart */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            Tasks by Lifecycle Status
          </h3>
          <DonutChart data={mockTasksByStatus} size={160} />
        </div>

        {/* Users by Role Breakdown */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            User Community Distribution
          </h3>
          <HorizontalBarChart data={mockUsersByRole} />
        </div>

        {/* 7-Day Revenue Velocity */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              7-Day Volume Velocity (GMV)
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-secondary)', fontWeight: 700 }}>
              +24% vs Last Week
            </span>
          </div>
          <RevenueAreaChart data={mockRevenueVelocity} height={140} />
        </div>
      </div>

      {/* ── Recent Activity Tables ──────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}
      >
        <DataTable
          title="Recent User Registrations"
          columns={userColumns}
          data={mockRecentUsers}
          pageSize={5}
          searchPlaceholder="Filter recent signups..."
          onRowClick={(user) => {
            if (onNavigate) {
              if (user.role === 'CLIENT') onNavigate('clients');
              else if (user.role === 'GIG_PROFESSIONAL') onNavigate('gig-pros');
              else if (user.role === 'MANAGER') onNavigate('managers');
            }
          }}
        />

        <DataTable
          title="Recent Platform Tasks"
          columns={projectColumns}
          data={mockProjects}
          pageSize={5}
          searchPlaceholder="Filter recent tasks..."
          onRowClick={() => onNavigate && onNavigate('projects')}
        />
      </div>
    </div>
  );
};

export default Dashboard;
