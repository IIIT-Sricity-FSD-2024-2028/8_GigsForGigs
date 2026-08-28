import React, { useEffect, useState } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DonutChart, HorizontalBarChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import {
  UsersIcon,
  PaymentIcon,
  ProjectIcon
} from '../../../components/super-admin/Icons';
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminDashboardStats, AdminTask, AdminUser } from '../../../types/super-admin';

/**
 * @file Dashboard.tsx
 * @description
 * High-level executive overview for the GigsForGigs platform owner and delegate admins.
 * KPI tiles and the two breakdown charts come from real /api/admin data
 * (dashboard/stats, users, tasks). Escrow-held and the dispute alert banner
 * have NO backing anywhere in the schema (no escrow/dispute tables) and are
 * intentionally omitted rather than faked — see PlatformSettings/DisputesReports
 * for the same gap.
 */

export interface DashboardProps {
  onNavigate?: (viewId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#519e8a',
  in_progress: '#084b83',
  completed: '#137333'
};
const ROLE_COLORS: Record<string, string> = {
  gig_professional: '#084b83',
  client: '#519e8a',
  manager: '#bf6900',
  admin: '#6a1b9a'
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentTasks, setRecentTasks] = useState<AdminTask[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<{ label: string; count: number; color: string }[]>([]);
  const [usersByRole, setUsersByRole] = useState<{ label: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardStats, users, tasks] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.listUsers(),
          adminApi.listTasks()
        ]);
        if (cancelled) return;
        setStats(dashboardStats);
        setRecentUsers(users.slice(0, 5));
        setRecentTasks(tasks.slice(0, 5));

        const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
          acc[t.status] = (acc[t.status] ?? 0) + 1;
          return acc;
        }, {});
        setTasksByStatus(
          Object.entries(statusCounts).map(([label, count]) => ({
            label,
            count,
            color: STATUS_COLORS[label] ?? '#888'
          }))
        );

        const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
          acc[u.role] = (acc[u.role] ?? 0) + 1;
          return acc;
        }, {});
        setUsersByRole(
          Object.entries(roleCounts).map(([label, count]) => ({
            label,
            count,
            color: ROLE_COLORS[label] ?? '#888'
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userColumns: ColumnDef<AdminUser>[] = [
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
      header: 'Joined',
      cell: (row) => new Date(row.createdAt).toLocaleString()
    }
  ];

  const taskColumns: ColumnDef<AdminTask>[] = [
    {
      header: 'Task Title',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Client: {row.client.clientName}</span>
        </div>
      )
    },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${Number(row.budget).toLocaleString()}</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      cell: (row) => (row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—')
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-danger-bg, #fdecea)',
          color: 'var(--color-danger-text, #c5221f)'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
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
          value={`$${(stats?.grossMerchandiseVolume ?? 0).toLocaleString()}`}
          subtitle="Sum of completed payments"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Active Contracts"
          value={(stats?.activeTasks ?? 0).toLocaleString()}
          subtitle="Open + in-progress tasks"
          icon={<ProjectIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Total Registered Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          subtitle={`${stats?.totalClients ?? 0} Clients · ${stats?.totalGigPros ?? 0} Gig Pros · ${stats?.totalManagers ?? 0} Managers`}
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Avg. Platform Rating"
          value={(stats?.avgPlatformRating ?? 0).toFixed(2)}
          subtitle={`${stats?.totalApplications ?? 0} total applications`}
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
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            Tasks by Lifecycle Status
          </h3>
          <DonutChart data={tasksByStatus} size={160} />
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            User Community Distribution
          </h3>
          <HorizontalBarChart data={usersByRole} />
        </div>
      </div>
      {/* Note: a 7-day GMV velocity time series (as in the old mock) has no
          backing endpoint — dashboard/stats only returns lifetime aggregates,
          not a daily breakdown — so that chart has been dropped rather than
          faked. Same for escrow-held and pending-disputes: no such tables. */}

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
          data={recentUsers}
          pageSize={5}
          searchPlaceholder="Filter recent signups..."
          onRowClick={(user) => {
            if (onNavigate) {
              if (user.role === 'client') onNavigate('clients');
              else if (user.role === 'gig_professional') onNavigate('gig-pros');
              else if (user.role === 'manager') onNavigate('managers');
            }
          }}
        />

        <DataTable
          title="Recent Platform Tasks"
          columns={taskColumns}
          data={recentTasks}
          pageSize={5}
          searchPlaceholder="Filter recent tasks..."
          onRowClick={() => onNavigate && onNavigate('projects')}
        />
      </div>
    </div>
  );
};

export default Dashboard;
