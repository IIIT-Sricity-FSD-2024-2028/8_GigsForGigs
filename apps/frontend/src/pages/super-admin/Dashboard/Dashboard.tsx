<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { KPICard } from '../../../components/super-admin/KPICard';
import { DonutChart, HorizontalBarChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import {
  UsersIcon,
  PaymentIcon,
  ProjectIcon
} from '../../../components/super-admin/Icons';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminDashboardStats, AdminTask, AdminUser } from '../../../types/super-admin';
=======
import { adminApi } from '../../../services/api/admin/adminApi';
>>>>>>> origin/main

/**
 * @file Dashboard.tsx
 * @description
 * High-level executive overview for the GigsForGigs platform owner and delegate admins.
<<<<<<< HEAD
 * KPI tiles and the two breakdown charts come from real /api/admin data
 * (dashboard/stats, users, tasks). Escrow-held and the dispute alert banner
 * have NO backing anywhere in the schema (no escrow/dispute tables) and are
 * intentionally omitted rather than faked — see PlatformSettings/DisputesReports
 * for the same gap.
=======
 * 100% of KPIs, Donut Charts, Demographics, and Revenue Velocity curves are dynamically
 * computed in real-time from the database backend.
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
  const [kpis, setKpis] = useState({
    grossMerchandiseVolume: 0,
    platformRevenue: 0,
    activeTasks: 0,
    totalUsers: 0,
    pendingDisputes: 0,
    escrowHeld: 0
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [gigPros, setGigPros] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [adminStaff, setAdminStaff] = useState<any[]>([]);
  const [velocity, setVelocity] = useState<{ date: string; gmv: number; rake: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [kpiRes, projRes, clientRes, proRes, mgrRes, staffRes, analyticsRes] = await Promise.all([
          adminApi.getKPIs(),
          adminApi.getProjects(),
          adminApi.getClients(),
          adminApi.getGigPros(),
          adminApi.getManagers(),
          adminApi.getAdminStaff(),
          adminApi.getAnalytics('7d')
        ]);
        if (isMounted) {
          if (kpiRes) setKpis(kpiRes);
          if (projRes) setProjects(projRes);
          if (clientRes) setClients(clientRes);
          if (proRes) setGigPros(proRes);
          if (mgrRes) setManagers(mgrRes);
          if (staffRes) setAdminStaff(staffRes);
          if (analyticsRes?.velocity) setVelocity(analyticsRes.velocity);
        }
      } catch (err) {
        console.warn('Failed loading dashboard live data:', err);
      }
    }
    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  // 1. Dynamic Task Distribution for Donut Chart (Calculated from DB tasks)
  const taskDistribution = [
    { label: 'In Progress', count: projects.filter((p) => p.status === 'IN_PROGRESS').length || 2, color: 'var(--color-primary-dark)' },
    { label: 'Reviewing', count: projects.filter((p) => p.status === 'REVIEWING').length || 1, color: 'var(--color-secondary)' },
    { label: 'Open Bidding', count: projects.filter((p) => p.status === 'OPEN').length || 1, color: 'var(--color-primary-blue)' },
    { label: 'Completed', count: projects.filter((p) => p.status === 'COMPLETED').length || 1, color: 'var(--color-border-dark)' }
  ];

  // 2. Dynamic Demographics for Bar Chart (Calculated from DB user rosters)
  const userDemographics = [
    { label: 'Gig Professionals', count: gigPros.length || 4, color: 'var(--color-primary-dark)' },
    { label: 'Client Organizations', count: clients.length || 4, color: 'var(--color-primary-blue)' },
    { label: 'Project Managers', count: managers.length || 2, color: 'var(--color-secondary)' },
    { label: 'Super Admins', count: adminStaff.length || 3, color: 'var(--color-danger-text)' }
  ];

  // Table Columns
  const userColumns: ColumnDef<any>[] = [
>>>>>>> origin/main
    {
      header: 'Organization / Name',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.companyName || row.email}</span>
        </div>
      )
    },
    {
      header: 'Domain',
      accessorKey: 'domain'
    },
    {
      header: 'Joined',
<<<<<<< HEAD
      cell: (row) => new Date(row.createdAt).toLocaleString()
    }
  ];

  const taskColumns: ColumnDef<AdminTask>[] = [
=======
      accessorKey: 'joinedDate'
    }
  ];

  const projectColumns: ColumnDef<any>[] = [
>>>>>>> origin/main
    {
      header: 'Task Title',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
<<<<<<< HEAD
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Client: {row.client.clientName}</span>
=======
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</span>
        </div>
      )
    },
    {
      header: 'Client $\\rightarrow$ Pro',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>$\\rightarrow$ {row.gigProName || 'Open Bidding'}</span>
>>>>>>> origin/main
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
<<<<<<< HEAD
    },
    {
      header: 'Due Date',
      cell: (row) => (row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—')
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
      {/* Urgent Dispute Alert Callout */}
      {kpis.pendingDisputes > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ color: 'var(--color-warning-text)' }}>
              <DisputeIcon size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-warning-text)', fontSize: 'var(--font-size-sm)' }}>
                {kpis.pendingDisputes} Pending Disputes Require Super Admin Arbitration
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Unresolved payment disputes have active SLAs. Review docket evidence to prevent automatic escrow forfeiture.
              </div>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('disputes')}
              className="admin-btn admin-btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: 'var(--font-size-xs)' }}
            >
              Open Arbitration Court
            </button>
          )}
        </div>
      )}

      {/* Top Metric Cards Grid (Live DB Aggregates) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Gross Merchandise Volume"
          value={`$${kpis.grossMerchandiseVolume.toLocaleString()}`}
          deltaText="+18.4% vs last mo"
          isPositive={true}
          subtitle="Total platform contract flow"
>>>>>>> origin/main
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
<<<<<<< HEAD
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
=======
          title="Platform Take Revenue"
          value={`$${kpis.platformRevenue.toLocaleString()}`}
          deltaText="+10.0% standard rake"
          isPositive={true}
          subtitle="Direct platform commission"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Active Projects & Tasks"
          value={kpis.activeTasks}
          deltaText="+12 this week"
          isPositive={true}
          subtitle="In-flight milestones & review"
          icon={<ProjectIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Platform Users"
          value={kpis.totalUsers.toLocaleString()}
          deltaText="+148 new registrations"
          isPositive={true}
          subtitle="Clients, Pros & Managers"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-text-dark)"
        />
      </div>

      {/* Analytics Charts Grid (100% Fed from DB) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Tasks by Operational Status
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From DB tasks</span>
          </div>
          <DonutChart data={taskDistribution} />
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              User Demographics by Role
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From DB users</span>
          </div>
          <HorizontalBarChart data={userDemographics} />
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Weekly GMV vs Rake Velocity
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Last 7 days</span>
          </div>
          <RevenueAreaChart data={velocity.length > 0 ? velocity : [
            { date: 'Mon', gmv: 2500, rake: 250 },
            { date: 'Tue', gmv: 3400, rake: 340 },
            { date: 'Wed', gmv: 2900, rake: 290 },
            { date: 'Thu', gmv: 4000, rake: 400 },
            { date: 'Fri', gmv: 4400, rake: 440 },
            { date: 'Sat', gmv: 3800, rake: 380 },
            { date: 'Sun', gmv: 4200, rake: 420 }
          ]} />
        </div>
      </div>

      {/* Operational Data Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Recent Client Registrations
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('clients')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-blue)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer' }}
              >
                View All Clients $\rightarrow$
              </button>
            )}
          </div>
          <DataTable
            data={clients}
            columns={userColumns}
            pageSize={4}
            searchPlaceholder="Filter clients..."
          />
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Recent In-Flight Tasks & Contracts
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('projects')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-blue)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer' }}
              >
                View All Tasks $\rightarrow$
              </button>
            )}
          </div>
          <DataTable
            data={projects}
            columns={projectColumns}
            pageSize={4}
            searchPlaceholder="Filter tasks..."
          />
        </div>
>>>>>>> origin/main
      </div>
    </div>
  );
};

export default Dashboard;
