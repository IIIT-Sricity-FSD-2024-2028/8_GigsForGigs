import React, { useEffect, useMemo } from 'react';
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
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchKPIs,
  fetchProjects,
  fetchClients,
  fetchGigPros,
  fetchManagers,
  fetchAdminStaff,
  fetchAuditLogs
} from '../../../store/admin/adminSlice';
import {
  selectKPIs,
  selectKPIsRequest,
  selectProjects,
  selectProjectsRequest,
  selectClients,
  selectClientsRequest,
  selectGigPros,
  selectGigProsRequest,
  selectManagers,
  selectManagersRequest,
  selectAdminStaff,
  selectAdminStaffRequest,
  selectAuditLogs,
  selectAuditLogsRequest
} from '../../../store/admin/selectors';
import type { AuditLogEntry, ClientDetail, ProjectTask } from '../../../store/admin/types';
import { canAccessAdminView } from '../../../utils/adminAccess';
import { formatCurrency } from '../../../utils/format';

/**
 * @file Dashboard.tsx
 * @description
 * High-level executive overview for the GigsForGigs platform owner and delegate admins.
 * 100% of KPIs, Donut Charts, Demographics, and activity tables are fed from the Redux store.
 */

export interface DashboardProps {
  onNavigate?: (viewId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, hasPermission } = useAuth();
  const dispatch = useAppDispatch();
  const canReadUsers = hasPermission('users:read');

  const rawKpis = useAppSelector(selectKPIs);
  const kpisRequest = useAppSelector(selectKPIsRequest);
  const projects = useAppSelector(selectProjects);
  const projectsRequest = useAppSelector(selectProjectsRequest);
  const clients = useAppSelector(selectClients);
  const clientsRequest = useAppSelector(selectClientsRequest);
  const gigPros = useAppSelector(selectGigPros);
  const gigProsRequest = useAppSelector(selectGigProsRequest);
  const managers = useAppSelector(selectManagers);
  const managersRequest = useAppSelector(selectManagersRequest);
  const adminStaff = useAppSelector(selectAdminStaff);
  const adminStaffRequest = useAppSelector(selectAdminStaffRequest);
  const auditLogs = useAppSelector(selectAuditLogs);
  const auditLogsRequest = useAppSelector(selectAuditLogsRequest);

  const kpis = rawKpis || {
    grossMerchandiseVolume: 0,
    platformRevenue: 0,
    activeTasks: 0,
    totalUsers: 0,
    pendingDisputes: 0,
    escrowHeld: 0,
    kycVerificationRate: null
  };

  const activity = useMemo(() => auditLogs.slice(0, 6), [auditLogs]);
  const loading = kpisRequest.status === 'loading' && !rawKpis;
  const error = kpisRequest.error;

  const secondaryErrors = [
    projectsRequest.status === 'failed' ? projectsRequest.error : null,
    adminStaffRequest.status === 'failed' ? adminStaffRequest.error : null,
    auditLogsRequest.status === 'failed' ? auditLogsRequest.error : null,
    ...(canReadUsers
      ? [
          clientsRequest.status === 'failed' ? clientsRequest.error : null,
          gigProsRequest.status === 'failed' ? gigProsRequest.error : null,
          managersRequest.status === 'failed' ? managersRequest.error : null,
        ]
      : []),
  ].filter((msg): msg is string => Boolean(msg));

  useEffect(() => {
    void dispatch(fetchKPIs());
    void dispatch(fetchProjects());
    void dispatch(fetchAdminStaff());
    void dispatch(fetchAuditLogs());
    if (canReadUsers) {
      void dispatch(fetchClients());
      void dispatch(fetchGigPros());
      void dispatch(fetchManagers());
    }
  }, [dispatch, canReadUsers]);

  // 1. Dynamic Task Distribution for Donut Chart (Calculated from Redux tasks)
  const taskDistribution = [
    { label: 'In Progress', count: projects.filter((p) => p.status === 'IN_PROGRESS').length, color: 'var(--color-primary-dark)' },
    { label: 'Open Bidding', count: projects.filter((p) => p.status === 'OPEN').length, color: 'var(--color-primary-blue)' },
    { label: 'Completed', count: projects.filter((p) => p.status === 'COMPLETED').length, color: 'var(--color-border-dark)' }
  ];

  // 2. Dynamic Demographics for Bar Chart (Calculated from Redux user rosters)
  const userDemographics = [
    { label: 'Gig Professionals', count: gigPros.length, color: 'var(--color-primary-dark)' },
    { label: 'Client Organizations', count: clients.length, color: 'var(--color-primary-blue)' },
    { label: 'Project Managers', count: managers.length, color: 'var(--color-secondary)' },
    { label: 'Super Admins', count: adminStaff.length, color: 'var(--color-danger-text)' }
  ];

  // Table Columns
  const userColumns: ColumnDef<ClientDetail>[] = [
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
      cell: (row) => row.domain || '—'
    },
    {
      header: 'Joined',
      accessorKey: 'joinedDate'
    }
  ];

  const projectColumns: ColumnDef<ProjectTask>[] = [
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
          <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {row.gigProName ? (
              <>
                <ArrowRightIcon size={11} color="var(--color-text-muted)" /> {row.gigProName}
              </>
            ) : (
              'Open Bidding'
            )}
          </span>
        </div>
      )
    },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.budget)}</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    }
  ];

  if (loading) {
    return <Loader label="Loading executive command overview..." />;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-danger-text, #c5221f)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Platform Data Synchronization Error</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>{error}</p>
      </div>
    );
  }

  const canViewClients = Boolean(onNavigate) && canAccessAdminView(user?.adminTier, 'clients');
  const canViewProjects = Boolean(onNavigate) && canAccessAdminView(user?.adminTier, 'projects');
  const canViewDisputes = Boolean(onNavigate) && canAccessAdminView(user?.adminTier, 'disputes');
  const canViewAdminStaff = Boolean(onNavigate) && canAccessAdminView(user?.adminTier, 'admin-staff');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Partial Fetch Warning Banner */}
      {secondaryErrors.length > 0 && (
        <div
          className="admin-card"
          style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning-text)',
            color: 'var(--color-warning-text)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600
          }}
        >
          Some dashboard sections could not refresh: {secondaryErrors[0]}
        </div>
      )}

      {/* Urgent Dispute Alert Callout */}
      {kpis.pendingDisputes > 0 && (
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(197, 34, 31, 0.08)',
            border: '1px solid rgba(197, 34, 31, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger-text)' }}>
            <DisputeIcon size={18} color="var(--color-danger-text)" />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
              {kpis.pendingDisputes} active dispute {kpis.pendingDisputes === 1 ? 'docket requires' : 'dockets require'} arbitration review.
            </span>
          </div>
          {canViewDisputes && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('disputes')}
              className="admin-btn admin-btn-danger"
              style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Open Arbitration Court <ArrowRightIcon size={13} />
            </button>
          )}
        </div>
      )}

      {/* 6-Card Operational Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Gross Merchandise Volume"
          value={formatCurrency(kpis.grossMerchandiseVolume)}
          subtitle="Held in escrow plus released"
          icon={<PaymentIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Platform Take Revenue"
          value={formatCurrency(kpis.platformRevenue)}
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
          value={kpis.totalUsers}
          subtitle="Registered accounts across roles"
          icon={<UsersIcon size={20} />}
          accentColor="var(--color-primary-blue)"
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

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Tasks by Status
            </h3>
          </div>
          <DonutChart data={taskDistribution} />
        </div>

        {canReadUsers && (
          <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                User Demographics
              </h3>
            </div>
            <HorizontalBarChart data={userDemographics} />
          </div>
        )}
      </div>

      {/* Operational Data Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        {canReadUsers && (
          <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Recent Client Registrations
              </h3>
              {canViewClients && onNavigate && (
                <button
                  onClick={() => onNavigate('clients')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-blue)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  View All Clients <ArrowRightIcon size={13} color="var(--color-primary-blue)" />
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
        )}

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Recent In-Flight Tasks & Contracts
            </h3>
            {canViewProjects && onNavigate && (
              <button
                onClick={() => onNavigate('projects')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary-blue)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View All Tasks <ArrowRightIcon size={13} color="var(--color-primary-blue)" />
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

      {/* Accountability: the latest audited admin actions */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Recent Admin Activity
          </h3>
          {canViewAdminStaff && onNavigate && (
            <button
              onClick={() => onNavigate('admin-staff')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-blue)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Full Audit Log <ArrowRightIcon size={13} color="var(--color-primary-blue)" />
            </button>
          )}
        </div>
        {activity.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>No admin actions recorded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activity.map((a: AuditLogEntry) => (
              <li key={a.id || String(a.auditId)} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: 'var(--font-size-sm)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span>
                  <strong>{a.action}</strong> on {a.target}
                  <span style={{ color: 'var(--color-text-muted)' }}> by {a.adminEmail || a.actorEmail}</span>
                </span>
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)' }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
