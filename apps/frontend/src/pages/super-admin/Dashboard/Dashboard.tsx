import React, { useState, useEffect } from 'react';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DonutChart, HorizontalBarChart, RevenueAreaChart } from '../../../components/super-admin/SimpleCharts';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import {
  UsersIcon,
  PaymentIcon,
  ProjectIcon,
  DisputeIcon,
  ArrowRightIcon
} from '../../../components/super-admin/Icons';
import { adminApi } from '../../../services/api/admin/adminApi';

/**
 * @file Dashboard.tsx
 * @description
 * High-level executive overview for the GigsForGigs platform owner and delegate admins.
 * 100% of KPIs, Donut Charts, Demographics, and Revenue Velocity curves are dynamically
 * computed in real-time from the database backend.
 */

export interface DashboardProps {
  onNavigate?: (viewId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [velocityRange, setVelocityRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [isVelocityLoading, setIsVelocityLoading] = useState(false);

  const handleRangeChange = async (range: '7d' | '30d' | '90d') => {
    setVelocityRange(range);
    try {
      setIsVelocityLoading(true);
      const res = await adminApi.getAnalytics(range);
      if (res?.velocity) setVelocity(res.velocity);
    } catch (err) {
      console.warn('Failed to load velocity for range', range, err);
    } finally {
      setIsVelocityLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [kpiRes, projRes, clientRes, proRes, mgrRes, staffRes, analyticsRes] = await Promise.all([
          adminApi.getKPIs().catch(() => null),
          adminApi.getProjects().catch(() => []),
          adminApi.getClients().catch(() => []),
          adminApi.getGigPros().catch(() => []),
          adminApi.getManagers().catch(() => []),
          adminApi.getAdminStaff().catch(() => []),
          adminApi.getAnalytics('7d').catch(() => null)
        ]);
        if (isMounted) {
          if (kpiRes) setKpis(kpiRes);
          setProjects(Array.isArray(projRes) ? projRes : []);
          setClients(Array.isArray(clientRes) ? clientRes : []);
          setGigPros(Array.isArray(proRes) ? proRes : []);
          setManagers(Array.isArray(mgrRes) ? mgrRes : []);
          setAdminStaff(Array.isArray(staffRes) ? staffRes : []);
          if (analyticsRes?.velocity) setVelocity(analyticsRes.velocity);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed loading dashboard live data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  // 1. Dynamic Task Distribution for Donut Chart (Calculated from DB tasks)
  const taskDistribution = [
    { label: 'In Progress', count: projects.filter((p) => p.status === 'IN_PROGRESS').length, color: 'var(--color-primary-dark)' },
    { label: 'Open Bidding', count: projects.filter((p) => p.status === 'OPEN').length, color: 'var(--color-primary-blue)' },
    { label: 'Completed', count: projects.filter((p) => p.status === 'COMPLETED').length, color: 'var(--color-border-dark)' }
  ];

  // 2. Dynamic Demographics for Bar Chart (Calculated from DB user rosters)
  const userDemographics = [
    { label: 'Gig Professionals', count: gigPros.length, color: 'var(--color-primary-dark)' },
    { label: 'Client Organizations', count: clients.length, color: 'var(--color-primary-blue)' },
    { label: 'Project Managers', count: managers.length, color: 'var(--color-secondary)' },
    { label: 'Super Admins', count: adminStaff.length, color: 'var(--color-danger-text)' }
  ];

  // Table Columns
  const userColumns: ColumnDef<any>[] = [
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
      accessorKey: 'joinedDate'
    }
  ];

  const projectColumns: ColumnDef<any>[] = [
    {
      header: 'Task Title',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
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
        </div>
      )
    },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>₹{Number(row.budget).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Gross Merchandise Volume"
          value={`₹${kpis.grossMerchandiseVolume.toLocaleString('en-IN')}`}
          subtitle="Total platform contract flow"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Platform Take Revenue"
          value={`₹${kpis.platformRevenue.toLocaleString('en-IN')}`}
          subtitle="Direct platform commission (10% rake)"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Active Projects & Tasks"
          value={kpis.activeTasks}
          subtitle="In-flight milestones & open bidding"
          icon={<ProjectIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
        <KPICard
          title="Platform Users"
          value={kpis.totalUsers.toLocaleString()}
          subtitle="Clients, Pros & Managers"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-text-dark)"
        />
      </div>

      {/* Analytics Charts Grid (100% Fed from DB with Analytical Explanations) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Tasks by Operational Status
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From DB tasks</span>
          </div>
          <DonutChart data={taskDistribution} />
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '8px', lineHeight: 1.4 }}>
            💡 <strong>Operational Flow:</strong> Tracks task pipeline balance across Open Bidding, Active Milestones, and Final Completion to anticipate payout velocity and prevent escrow lockups.
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              User Demographics by Role
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From DB users</span>
          </div>
          <HorizontalBarChart data={userDemographics} />
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '8px', lineHeight: 1.4 }}>
            💡 <strong>Roster Liquidity:</strong> Proportions between Freelancer talent supply and Client/Manager hiring demand. Healthy ratio ensures rapid task matching without talent starvation.
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                GMV vs Rake Velocity
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Live Escrow Flow ({velocityRange.toUpperCase()})</span>
            </div>
            <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isVelocityLoading}
                  onClick={() => handleRangeChange(r)}
                  style={{
                    padding: '3px 8px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: velocityRange === r ? 'var(--color-primary-dark)' : 'transparent',
                    color: velocityRange === r ? '#ffffff' : 'var(--color-text-dark)',
                    fontWeight: 700,
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <RevenueAreaChart data={velocity} />
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '8px', lineHeight: 1.4 }}>
            💡 <strong>Financial Velocity:</strong> Real-time dual series comparing Gross Merchandise Volume (GMV) against realized platform commission (10% rake) dynamically sliced for {velocityRange.toUpperCase()}.
          </div>
        </div>
      </div>

      {/* Operational Data Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
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
                View All Clients <ArrowRightIcon size={13} color="var(--color-primary-blue)" style={{ marginLeft: '4px' }} />
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
                View All Tasks <ArrowRightIcon size={13} color="var(--color-primary-blue)" style={{ marginLeft: '4px' }} />
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
      </div>
    </div>
  );
};

export default Dashboard;
