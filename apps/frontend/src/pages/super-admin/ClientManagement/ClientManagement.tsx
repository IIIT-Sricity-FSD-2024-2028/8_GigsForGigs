import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from '../../../components/common/Loader';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { FilterPillBar, type FilterPillOption } from '../../../components/super-admin/FilterPillBar';
import { ClientIcon, PlusIcon, ShieldIcon } from '../../../components/super-admin/Icons';
import { KPICard } from '../../../components/super-admin/KPICard';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/useToast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import type { ClientDetail } from '../../../services/api/admin/adminTypes';
import {
  createClientAccount,
  decideClientKYC,
  fetchClientDossier,
  fetchClients,
  updateClientDetails,
  updateUserStatus,
} from '../../../store/admin/adminSlice';
import {
  selectClientDossierById,
  selectClientDossierRequest,
  selectClients,
  selectClientsRequest,
} from '../../../store/admin/selectors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { extractErrorMessage } from '../../../utils/adminAccess';
import { formatCurrency } from '../../../utils/format';
import { safeHttpUrl } from '../../../utils/safeUrl';

type ClientFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
type ClientInspectTab = 'overview' | 'history' | 'edit';

interface ProvisionClientForm {
  name: string;
  email: string;
  password: string;
  companyName: string;
  domain: string;
}

interface EditClientForm {
  name: string;
  email: string;
  companyName: string;
  domain: string;
}

const EMPTY_PROVISION: ProvisionClientForm = {
  name: '',
  email: '',
  password: '',
  companyName: '',
  domain: '',
};

function domainHref(domain: string | null | undefined): string | undefined {
  if (!domain || !domain.trim()) return undefined;
  const trimmed = domain.trim();
  const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  return safeHttpUrl(candidate);
}

export const ClientManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const clients = useAppSelector(selectClients);
  const clientsRequest = useAppSelector(selectClientsRequest);
  const dossierRequest = useAppSelector(selectClientDossierRequest);

  const [filter, setFilter] = useState<ClientFilter>('ALL');
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [inspectTab, setInspectTab] = useState<ClientInspectTab>('overview');

  // Provision Client Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState<ProvisionClientForm>(EMPTY_PROVISION);
  const [provisionSubmitting, setProvisionSubmitting] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Edit Organization Form State
  const [editForm, setEditForm] = useState<EditClientForm>({
    name: '',
    email: '',
    companyName: '',
    domain: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation Dialog State (Suspend / Reactivate / KYC Reject)
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    kind: 'SUSPEND' | 'ACTIVATE' | 'REJECT_KYC';
    client: ClientDetail | null;
    reason: string;
    loading: boolean;
  }>({ open: false, kind: 'SUSPEND', client: null, reason: '', loading: false });

  useEffect(() => {
    void dispatch(fetchClients());
  }, [dispatch]);

  const activeDossier = useAppSelector((state) =>
    selectedClient ? selectClientDossierById(state, selectedClient.id) : null,
  );

  // Sync live table row changes into selectedClient without mutating state in effects
  const liveSelectedClient = useMemo(() => {
    if (!selectedClient) return null;
    return clients.find((c) => c.id === selectedClient.id) ?? selectedClient;
  }, [clients, selectedClient]);

  const metrics = useMemo(() => {
    const verified = clients.filter((c) => c.kycStatus === 'VERIFIED').length;
    const pending = clients.filter((c) => c.kycStatus === 'PENDING').length;
    const rejected = clients.filter((c) => c.kycStatus === 'REJECTED').length;
    const suspended = clients.filter((c) => c.status === 'SUSPENDED').length;
    const active = clients.filter((c) => c.status === 'ACTIVE').length;
    const totalSpend = clients.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
    const activeGigs = clients.reduce((sum, c) => sum + Number(c.activeGigsCount || 0), 0);
    const completedGigs = clients.reduce((sum, c) => sum + Number(c.completedGigsCount || 0), 0);

    return {
      total: clients.length,
      verified,
      pending,
      rejected,
      suspended,
      active,
      totalSpend,
      activeGigs,
      completedGigs,
    };
  }, [clients]);

  const filterOptions: FilterPillOption<ClientFilter>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Clients', count: metrics.total },
      { value: 'PENDING', label: 'Pending KYC', count: metrics.pending },
      { value: 'VERIFIED', label: 'Verified KYC', count: metrics.verified },
      { value: 'REJECTED', label: 'Rejected KYC', count: metrics.rejected },
      { value: 'SUSPENDED', label: 'Suspended', count: metrics.suspended },
    ],
    [metrics],
  );

  const filteredClients = useMemo(() => {
    switch (filter) {
      case 'PENDING':
        return clients.filter((c) => c.kycStatus === 'PENDING');
      case 'VERIFIED':
        return clients.filter((c) => c.kycStatus === 'VERIFIED');
      case 'REJECTED':
        return clients.filter((c) => c.kycStatus === 'REJECTED');
      case 'SUSPENDED':
        return clients.filter((c) => c.status === 'SUSPENDED');
      default:
        return clients;
    }
  }, [clients, filter]);

  const canWrite = hasPermission('users:ban');

  const handleOpenInspect = (client: ClientDetail, tab: ClientInspectTab = 'overview') => {
    setSelectedClient(client);
    setInspectTab(tab);
    setEditForm({
      name: client.name,
      email: client.email,
      companyName: client.companyName,
      domain: client.domain ?? '',
    });
    setEditError(null);
    void dispatch(fetchClientDossier(client.id));
  };

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as ClientInspectTab;
    if (nextTab === 'edit' && liveSelectedClient) {
      setEditForm({
        name: activeDossier?.name ?? liveSelectedClient.name,
        email: activeDossier?.email ?? liveSelectedClient.email,
        companyName: activeDossier?.companyName ?? liveSelectedClient.companyName,
        domain: (activeDossier?.domain ?? liveSelectedClient.domain) ?? '',
      });
      setEditError(null);
    }
    setInspectTab(nextTab);
  };

  const handleOpenProvision = () => {
    setProvisionForm(EMPTY_PROVISION);
    setProvisionError(null);
    setIsProvisionOpen(true);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = provisionForm.name.trim();
    const email = provisionForm.email.trim();
    const password = provisionForm.password;
    const companyName = provisionForm.companyName.trim();
    const domain = provisionForm.domain.trim();

    if (name.length < 2 || companyName.length < 2 || !email.includes('@') || password.length < 8) {
      setProvisionError('Provide valid contact name, company name, email, and password (min 8 chars).');
      return;
    }

    setProvisionSubmitting(true);
    setProvisionError(null);
    try {
      await dispatch(
        createClientAccount({
          name,
          email,
          password,
          companyName,
          ...(domain ? { domain } : {}),
        }),
      ).unwrap();
      toast.success('Client Provisioned', `${companyName} is registered and ready for KYC review.`);
      setIsProvisionOpen(false);
      setProvisionForm(EMPTY_PROVISION);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to provision client account.');
      setProvisionError(msg);
      toast.error('Provisioning Failed', msg);
    } finally {
      setProvisionSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedClient) return;

    const resolvedUserId = liveSelectedClient.userId ?? (activeDossier ? String(activeDossier.userId) : '');
    if (!resolvedUserId) {
      setEditError('Client user identifier is unavailable.');
      return;
    }

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const companyName = editForm.companyName.trim();
    const domain = editForm.domain.trim();

    if (name.length < 2 || companyName.length < 2 || !email.includes('@')) {
      setEditError('Contact name, valid email, and organization name are required.');
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      await dispatch(
        updateClientDetails({
          clientId: liveSelectedClient.id,
          userId: resolvedUserId,
          name,
          email,
          companyName,
          domain: domain || null,
        }),
      ).unwrap();
      toast.success('Organization Updated', `${companyName} details saved.`);
      setInspectTab('overview');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to save client changes.');
      setEditError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleApproveKYC = async (client: ClientDetail) => {
    try {
      await dispatch(decideClientKYC({ clientId: client.id, status: 'VERIFIED' })).unwrap();
      toast.success('KYC Verified', `${client.companyName} has been approved.`);
    } catch (err) {
      toast.error('KYC Update Failed', extractErrorMessage(err, 'Could not verify client KYC.'));
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState.client) return;
    const target = confirmState.client;
    setConfirmState((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmState.kind === 'REJECT_KYC') {
        await dispatch(decideClientKYC({ clientId: target.id, status: 'REJECTED' })).unwrap();
        toast.warning('KYC Rejected', `${target.companyName} KYC submission was rejected.`);
      } else {
        const nextStatus = confirmState.kind === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
        const resolvedUserId = target.userId ?? (activeDossier?.clientId === Number(target.clientId ?? -1) ? String(activeDossier.userId) : target.id);
        await dispatch(
          updateUserStatus({
            userId: resolvedUserId,
            status: nextStatus,
            reason:
              confirmState.reason.trim() ||
              (nextStatus === 'SUSPENDED' ? 'Suspended from Client Organizations console' : 'Reactivated by Super Admin'),
          }),
        ).unwrap();
        toast.success(
          nextStatus === 'SUSPENDED' ? 'Client Suspended' : 'Client Reactivated',
          `${target.companyName} is now ${nextStatus.toLowerCase()}.`,
        );
      }
      setConfirmState({ open: false, kind: 'SUSPEND', client: null, reason: '', loading: false });
    } catch (err) {
      toast.error('Governance Action Failed', extractErrorMessage(err, 'Could not apply action.'));
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns: ColumnDef<ClientDetail>[] = [
    {
      header: 'Organization & Domain',
      cell: (row) => {
        const safeDomain = domainHref(row.domain);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{row.companyName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{row.id}</span>
              {row.domain && (
                <>
                  <span style={{ color: 'var(--color-border-dark)' }}>·</span>
                  {safeDomain ? (
                    <a
                      href={safeDomain}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary-blue)', textDecoration: 'none', fontWeight: 500 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.domain}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>{row.domain}</span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Primary Contact',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Spend & Gigs',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.totalSpent)}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {row.activeGigsCount} active · {row.completedGigsCount ?? 0} done
          </span>
        </div>
      ),
    },
    {
      header: 'Team Managers',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600 }}>{row.assignedManagersCount} seats</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {row.managers.length > 0 ? row.managers.slice(0, 2).map((m) => m.name).join(', ') : 'Unassigned'}
          </span>
        </div>
      ),
    },
    {
      header: 'KYC',
      cell: (row) => <StatusBadge status={row.kycStatus} />,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {canWrite && row.kycStatus === 'PENDING' && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => handleApproveKYC(row)}
            >
              Verify KYC
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-outline admin-btn-sm"
            onClick={() => handleOpenInspect(row, 'overview')}
          >
            Inspect
          </button>
        </div>
      ),
    },
  ];

  if (clientsRequest.status === 'loading' && clients.length === 0) {
    return <Loader label="Loading client organizations and KYC dossiers..." />;
  }

  if (clientsRequest.status === 'failed' && clients.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Client Directory Load Error</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          {clientsRequest.error || 'Could not load client organizations.'}
        </p>
      </div>
    );
  }

  const drawerTabs = [
    { id: 'overview', label: 'Overview & KYC' },
    { id: 'history', label: 'Tasks & Escrow History', count: activeDossier?.tasks.length },
    ...(canWrite ? [{ id: 'edit', label: 'Edit Organization' }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Executive Client KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Total Client Orgs"
          value={metrics.total}
          subtitle={`${metrics.active} active · ${metrics.suspended} suspended`}
          icon={<ClientIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Verified KYC"
          value={metrics.verified}
          subtitle="Cleared enterprise & startup buyers"
          icon={<ShieldIcon size={20} />}
          accentColor="var(--color-success-text)"
        />
        <KPICard
          title="Pending KYC"
          value={metrics.pending}
          subtitle={metrics.rejected > 0 ? `${metrics.rejected} rejected dossiers` : 'Compliance review queue'}
          icon={<ShieldIcon size={20} />}
          accentColor="var(--color-warning-text)"
        />
        <KPICard
          title="Combined Client Spend"
          value={formatCurrency(metrics.totalSpend)}
          subtitle={`${metrics.activeGigs} active · ${metrics.completedGigs} completed gigs`}
          icon={<ClientIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
      </div>

      {/* Filter Pills + Provision CTA */}
      <FilterPillBar
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
        summaryText={`Showing ${filteredClients.length} of ${clients.length} clients`}
        rightSlot={
          canWrite ? (
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenProvision}>
              <PlusIcon size={16} />
              <span>Provision Client</span>
            </button>
          ) : undefined
        }
      />

      {/* Client Table */}
      <DataTable
        title="Client Organizations & KYC Registry"
        columns={columns}
        data={filteredClients}
        searchPlaceholder="Search organization, email, domain, or manager..."
        pageSize={8}
      />

      {/* Provision Client Modal */}
      <ActionModal
        isOpen={isProvisionOpen}
        onClose={() => !provisionSubmitting && setIsProvisionOpen(false)}
        title="Provision Client Organization"
        subtitle="Creates a buyer account and corporate organization profile in a single atomic workflow."
        width="520px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsProvisionOpen(false)}
              disabled={provisionSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="provision-client-form"
              className="admin-btn admin-btn-primary"
              disabled={provisionSubmitting}
            >
              {provisionSubmitting ? 'Provisioning...' : 'Create Client Account'}
            </button>
          </>
        }
      >
        <form
          id="provision-client-form"
          onSubmit={handleProvisionSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
        >
          {provisionError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger-text)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
              }}
            >
              {provisionError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-dark)' }}>
              Organization Name *
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. Northstar Robotics Inc"
              value={provisionForm.companyName}
              onChange={(e) => setProvisionForm((p) => ({ ...p, companyName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-dark)' }}>
              Corporate Website Domain (Optional)
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. northstar.io"
              value={provisionForm.domain}
              onChange={(e) => setProvisionForm((p) => ({ ...p, domain: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-dark)' }}>
                Primary Contact Name *
              </label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Elena Rostova"
                value={provisionForm.name}
                onChange={(e) => setProvisionForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-dark)' }}>
                Corporate Email *
              </label>
              <input
                type="email"
                className="admin-input"
                placeholder="elena@northstar.io"
                value={provisionForm.email}
                onChange={(e) => setProvisionForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-dark)' }}>
              Temporary Password (min 8 chars) *
            </label>
            <input
              type="password"
              className="admin-input"
              placeholder="Minimum 8 characters"
              value={provisionForm.password}
              onChange={(e) => setProvisionForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
        </form>
      </ActionModal>

      {/* Inspect Client Drawer */}
      <ActionModal
        isOpen={Boolean(liveSelectedClient)}
        onClose={() => setSelectedClient(null)}
        isDrawer
        width="640px"
        title={liveSelectedClient?.companyName ?? 'Client Organization'}
        subtitle={
          liveSelectedClient
            ? `${liveSelectedClient.name} · ${liveSelectedClient.email} · Joined ${liveSelectedClient.joinedDate}`
            : undefined
        }
        footer={
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedClient(null)}>
            Close Dossier
          </button>
        }
      >
        {liveSelectedClient && (
          <div>
            <AdminTabs tabs={drawerTabs} activeTab={inspectTab} onChange={handleTabChange} />

            {inspectTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {/* Metrics Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Committed</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-dark)', marginTop: '4px' }}>
                      {formatCurrency(liveSelectedClient.totalSpent)}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active / Done Gigs</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-dark)', marginTop: '4px' }}>
                      {liveSelectedClient.activeGigsCount} / {liveSelectedClient.completedGigsCount ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Service Requests</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-dark)', marginTop: '4px' }}>
                      {activeDossier ? activeDossier.serviceRequestsCount : '—'}
                    </div>
                  </div>
                </div>

                {/* Compliance & Account Metadata */}
                <div style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>KYC Status</span>
                      <StatusBadge status={liveSelectedClient.kycStatus} />
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Account</span>
                      <StatusBadge status={liveSelectedClient.status} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Corporate Domain</span>
                    <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>
                      {liveSelectedClient.domain || 'Not declared'}
                    </strong>
                  </div>
                </div>

                {/* Assigned Managers */}
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                    Delegated Operations Managers ({liveSelectedClient.managers.length})
                  </h4>
                  {liveSelectedClient.managers.length === 0 ? (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '12px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                      No team manager seats are currently attached to this organization.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {liveSelectedClient.managers.map((mgr) => (
                        <div
                          key={mgr.managerId}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>{mgr.name}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{mgr.email}</div>
                          </div>
                          <StatusBadge status={mgr.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Governance Controls */}
                {canWrite && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {liveSelectedClient.kycStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => handleApproveKYC(liveSelectedClient)}
                        >
                          Approve KYC
                        </button>
                      )}
                      {liveSelectedClient.kycStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() =>
                            setConfirmState({
                              open: true,
                              kind: 'REJECT_KYC',
                              client: liveSelectedClient,
                              reason: '',
                              loading: false,
                            })
                          }
                        >
                          Reject KYC
                        </button>
                      )}
                    </div>

                    {liveSelectedClient.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            kind: 'SUSPEND',
                            client: liveSelectedClient,
                            reason: '',
                            loading: false,
                          })
                        }
                      >
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            kind: 'ACTIVATE',
                            client: liveSelectedClient,
                            reason: '',
                            loading: false,
                          })
                        }
                      >
                        Reactivate Account
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {inspectTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dossierRequest.status === 'loading' && !activeDossier && (
                  <Loader label="Fetching tasks and escrow records..." />
                )}
                {dossierRequest.status === 'failed' && !activeDossier && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)' }}>
                    {dossierRequest.error || 'Could not load client history.'}
                  </div>
                )}
                {activeDossier && activeDossier.tasks.length === 0 && (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    This organization has not posted any gig tasks yet.
                  </p>
                )}
                {activeDossier?.tasks.map((task) => (
                  <div
                    key={task.taskId}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          #TSK-{task.taskId}
                        </span>
                        <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>{task.title}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <StatusBadge status={task.status} />
                        {task.escrowStatus && <StatusBadge status={task.escrowStatus} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                      <span>
                        Budget: <strong style={{ color: 'var(--color-text-dark)' }}>{formatCurrency(task.budget)}</strong> · Escrow Committed:{' '}
                        <strong style={{ color: 'var(--color-primary-dark)' }}>{formatCurrency(task.totalCommitted)}</strong>
                      </span>
                      <span>
                        {task.applicationsCount} applicants · {task.deliverablesCount} deliverables · {task.createdAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inspectTab === 'edit' && canWrite && (
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {editError && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                    {editError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                    Corporate Domain
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Leave blank to clear domain"
                    value={editForm.domain}
                    onChange={(e) => setEditForm((p) => ({ ...p, domain: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      className="admin-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => setInspectTab('overview')}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={editSaving}>
                    {editSaving ? 'Saving...' : 'Save Organization Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </ActionModal>

      {/* Governance Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        onCancel={() => !confirmState.loading && setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
        isLoading={confirmState.loading}
        isDangerous={confirmState.kind !== 'ACTIVATE'}
        confirmLabel={
          confirmState.kind === 'REJECT_KYC'
            ? 'Reject KYC'
            : confirmState.kind === 'SUSPEND'
              ? 'Suspend Account'
              : 'Reactivate Account'
        }
        title={
          confirmState.kind === 'REJECT_KYC'
            ? `Reject KYC for ${confirmState.client?.companyName ?? 'Client'}`
            : confirmState.kind === 'SUSPEND'
              ? `Suspend ${confirmState.client?.companyName ?? 'Client'}`
              : `Reactivate ${confirmState.client?.companyName ?? 'Client'}`
        }
        message={
          confirmState.kind === 'REJECT_KYC'
            ? 'This marks the organization KYC status as REJECTED and logs a compliance entry.'
            : confirmState.kind === 'SUSPEND'
              ? 'Suspending revokes active buyer portal access until reactivated by a Super Admin.'
              : 'Restores buyer portal sign-in and active workspace privileges.'
        }
      />
    </div>
  );
};

export default ClientManagement;
