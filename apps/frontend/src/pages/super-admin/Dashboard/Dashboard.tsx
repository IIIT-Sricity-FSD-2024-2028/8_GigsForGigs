import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { KPICard } from '../../../components/super-admin/KPICard';
import { DonutChart, HorizontalBarChart } from '../../../components/super-admin/SimpleCharts';
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
    escrowHeld: 0,
    kycVerificationRate: null as number | null
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [gigPros, setGigPros] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [adminStaff, setAdminStaff] = useState<any[]>([]);
  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [kpiRes, projRes, clientRes, proRes, mgrRes, staffRes] = await Promise.all([
          // No per-call fallbacks: a failed request shows an error, never a zero that reads as real data.
          adminApi.getKPIs(),
          adminApi.getProjects(),
          adminApi.getClients(),
          adminApi.getGigPros(),
          adminApi.getManagers(),
          adminApi.getAdminStaff()
        ]);
        if (isMounted) {
          setKpis(kpiRes);
          setProjects(Array.isArray(projRes) ? projRes : []);
          setClients(Array.isArray(clientRes) ? clientRes : []);
          setGigPros(Array.isArray(proRes) ? proRes : []);
          setManagers(Array.isArray(mgrRes) ? mgrRes : []);
          setAdminStaff(Array.isArray(staffRes) ? staffRes : []);
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
      header: 'Client → Pro',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>→ {row.gigProName || 'Open Bidding'}</span>
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
    return <Loader label="Loading dashboard..." />;
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
                Unresolved payment disputes have active SLAs. Review the docket evidence and rule before the SLA is breached.
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
          subtitle="Held in escrow plus released"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Platform Take Revenue"
          value={`₹${kpis.platformRevenue.toLocaleString('en-IN')}`}
          subtitle="Fees on released payments"
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
          subtitle="All roles, including admin staff"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-text-dark)"
        />
        <KPICard
          title="Active Dispute Dockets"
          value={kpis.pendingDisputes}
          subtitle="Open or under review"
          icon={<DisputeIcon size={20} />}
          accentColor="var(--color-danger-text)"
        />
        <KPICard
          title="KYC Verification Rate"
          value={kpis.kycVerificationRate === null ? '—' : `${kpis.kycVerificationRate}%`}
          subtitle="Clients with verified KYC"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-secondary)"
        />
      </div>

      {/* Analytics Charts Grid (100% Fed from DB with Analytical Explanations) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Tasks by Status
            </h3>
            
          </div>
          <DonutChart data={taskDistribution} />
          
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              User Demographics
            </h3>
            
          </div>
          <HorizontalBarChart data={userDemographics} />
          
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
