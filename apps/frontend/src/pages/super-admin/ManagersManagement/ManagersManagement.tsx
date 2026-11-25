import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from '../../../components/common/Loader';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { FilterPillBar, type FilterPillOption } from '../../../components/super-admin/FilterPillBar';
import { ManagerIcon, PlusIcon, ProjectIcon } from '../../../components/super-admin/Icons';
import { KPICard } from '../../../components/super-admin/KPICard';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/useToast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import type { ManagerDetail } from '../../../services/api/admin/adminTypes';
import {
  createManagerSeat,
  fetchAssignments,
  fetchClients,
  fetchManagers,
  removeManagerSeat,
  updateManagerDetails,
  updateUserStatus,
} from '../../../store/admin/adminSlice';
import {
  selectAssignments,
  selectAssignmentsRequest,
  selectClients,
  selectClientsRequest,
  selectManagers,
  selectManagersRequest,
} from '../../../store/admin/selectors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { extractErrorMessage } from '../../../utils/adminAccess';
import { formatCurrency } from '../../../utils/format';

type ManagerFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED';
type ManagerManageTab = 'overview' | 'edit';

interface CreateManagerForm {
  name: string;
  email: string;
  password: string;
  clientId: string;
}

interface EditManagerForm {
  name: string;
  email: string;
}

export const ManagersManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const managers = useAppSelector(selectManagers);
  const managersRequest = useAppSelector(selectManagersRequest);
  const assignments = useAppSelector(selectAssignments);
  const assignmentsRequest = useAppSelector(selectAssignmentsRequest);
  const clients = useAppSelector(selectClients);
  const clientsRequest = useAppSelector(selectClientsRequest);

  const [filter, setFilter] = useState<ManagerFilter>('ALL');
  const [selectedManager, setSelectedManager] = useState<ManagerDetail | null>(null);
  const [manageTab, setManageTab] = useState<ManagerManageTab>('overview');

  // Add Manager Seat Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<CreateManagerForm>({
    name: '',
    email: '',
    password: '',
    clientId: '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Manager Form State
  const [editForm, setEditForm] = useState<EditManagerForm>({ name: '', email: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirm Dialog State (Suspend/Reactivate OR Unlink Seat)
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    kind: 'SUSPEND' | 'ACTIVATE' | 'UNLINK';
    manager: ManagerDetail | null;
    loading: boolean;
  }>({ open: false, kind: 'SUSPEND', manager: null, loading: false });

  useEffect(() => {
    void dispatch(fetchManagers());
    void dispatch(fetchAssignments());
    if (clientsRequest.status === 'idle') {
      void dispatch(fetchClients());
    }
  }, [dispatch, clientsRequest.status]);

  const liveSelectedManager = useMemo(() => {
    if (!selectedManager) return null;
    return managers.find((m) => m.id === selectedManager.id) ?? selectedManager;
  }, [managers, selectedManager]);

  const numericManagerId = useMemo(() => {
    if (!liveSelectedManager) return null;
    const num = Number(String(liveSelectedManager.managerId ?? liveSelectedManager.id).replace(/\D/g, ''));
    return Number.isNaN(num) ? null : num;
  }, [liveSelectedManager]);

  const managerAssignments = useMemo(() => {
    if (numericManagerId === null) return [];
    return assignments.filter((a) => a.managerId !== null && a.managerId === numericManagerId);
  }, [assignments, numericManagerId]);

  const metrics = useMemo(() => {
    const active = managers.filter((m) => m.status === 'ACTIVE').length;
    const suspended = managers.filter((m) => m.status === 'SUSPENDED').length;
    const totalSupervised = managers.reduce((sum, m) => sum + Number(m.activeSupervisedTasks || 0), 0);
    return {
      total: managers.length,
      active,
      suspended,
      totalSupervised,
    };
  }, [managers]);

  const filterOptions: FilterPillOption<ManagerFilter>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Managers', count: metrics.total },
      { value: 'ACTIVE', label: 'Active Seats', count: metrics.active },
      { value: 'SUSPENDED', label: 'Suspended Seats', count: metrics.suspended },
    ],
    [metrics],
  );

  const filteredManagers = useMemo(() => {
    if (filter === 'ACTIVE') return managers.filter((m) => m.status === 'ACTIVE');
    if (filter === 'SUSPENDED') return managers.filter((m) => m.status === 'SUSPENDED');
    return managers;
  }, [managers, filter]);

  const clientOptions = useMemo(
    () =>
      clients
        .map((c) => {
          const numId = Number(String(c.clientId ?? c.id).replace(/\D/g, ''));
          return {
            clientId: numId,
            label: `${c.companyName} (${c.name})`,
          };
        })
        .filter((opt) => !Number.isNaN(opt.clientId) && opt.clientId > 0),
    [clients],
  );

  const canWrite = hasPermission('users:ban');

  const handleOpenManage = (mgr: ManagerDetail, tab: ManagerManageTab = 'overview') => {
    setSelectedManager(mgr);
    setManageTab(tab);
    setEditForm({ name: mgr.name, email: mgr.email });
    setEditError(null);
  };

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as ManagerManageTab;
    if (nextTab === 'edit' && liveSelectedManager) {
      setEditForm({ name: liveSelectedManager.name, email: liveSelectedManager.email });
      setEditError(null);
    }
    setManageTab(nextTab);
  };

  const handleOpenAddModal = () => {
    if (clients.length === 0 && clientsRequest.status === 'idle') {
      void dispatch(fetchClients());
    }
    setAddForm({
      name: '',
      email: '',
      password: '',
      clientId: clientOptions[0] ? String(clientOptions[0].clientId) : '',
    });
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addForm.name.trim();
    const email = addForm.email.trim();
    const password = addForm.password;
    const numericClientId = Number(addForm.clientId);

    if (name.length < 2 || !email.includes('@') || password.length < 8 || Number.isNaN(numericClientId) || numericClientId <= 0) {
      setAddError('Provide valid manager name, email, password (min 8 chars), and a target client organization.');
      return;
    }

    setAddSubmitting(true);
    setAddError(null);
    try {
      await dispatch(
        createManagerSeat({
          name,
          email,
          password,
          clientId: numericClientId,
        }),
      ).unwrap();
      toast.success('Manager Seat Created', `${name} is now provisioned under the selected organization.`);
      setIsAddModalOpen(false);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to provision manager seat.');
      setAddError(msg);
      toast.error('Provisioning Failed', msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedManager) return;

    const resolvedUserId = liveSelectedManager.userId ?? '';
    if (!resolvedUserId) {
      setEditError('Manager user identifier is unavailable.');
      return;
    }

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    if (name.length < 2 || !email.includes('@')) {
      setEditError('Valid full name and email address are required.');
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      await dispatch(
        updateManagerDetails({
          userId: resolvedUserId,
          name,
          email,
        }),
      ).unwrap();
      toast.success('Manager Updated', `${name} profile details saved.`);
      setManageTab('overview');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to save manager details.');
      setEditError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState.manager) return;
    const target = confirmState.manager;
    setConfirmState((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmState.kind === 'UNLINK') {
        const managerIdNum = Number(String(target.managerId ?? target.id).replace(/\D/g, ''));
        const clientIdNum = target.clientId;
        if (!clientIdNum || Number.isNaN(managerIdNum)) {
          throw new Error('Missing organization linkage identifiers for this manager seat.');
        }
        await dispatch(removeManagerSeat({ clientId: clientIdNum, managerId: managerIdNum })).unwrap();
        toast.warning('Seat Unlinked', `${target.name} has been unlinked from ${target.clientName || 'client organization'}.`);
        setConfirmState({ open: false, kind: 'UNLINK', manager: null, loading: false });
        setSelectedManager(null);
      } else {
        const nextStatus = confirmState.kind === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
        const resolvedUserId = target.userId ?? target.id;
        await dispatch(
          updateUserStatus({
            userId: resolvedUserId,
            status: nextStatus,
            reason:
              nextStatus === 'SUSPENDED'
                ? 'Manager seat suspended from Operations console'
                : 'Manager seat reactivated by Super Admin',
          }),
        ).unwrap();
        toast.success(
          nextStatus === 'SUSPENDED' ? 'Seat Suspended' : 'Seat Reactivated',
          `${target.name} is now ${nextStatus.toLowerCase()}.`,
        );
        setConfirmState({ open: false, kind: 'SUSPEND', manager: null, loading: false });
      }
    } catch (err) {
      toast.error('Action Failed', extractErrorMessage(err, 'Could not complete manager action.'));
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns: ColumnDef<ManagerDetail>[] = [
    {
      header: 'Operations Manager',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{row.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              {row.id}
            </span>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Linked Organization',
      cell: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>
          {row.clientName || (row.linkedClients.length > 0 ? row.linkedClients.join(', ') : 'Unlinked')}
        </span>
      ),
    },
    {
      header: 'Supervised Tasks',
      cell: (row) => (
        <span className="admin-badge badge-info">{row.activeSupervisedTasks} assigned</span>
      ),
    },
    {
      header: 'Seat Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Provisioned Date',
      cell: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {row.createdAt || '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          type="button"
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={() => handleOpenManage(row, 'overview')}
        >
          Manage
        </button>
      ),
    },
  ];

  if (managersRequest.status === 'loading' && managers.length === 0) {
    return <Loader label="Loading operations managers and task assignments..." />;
  }

  if (managersRequest.status === 'failed' && managers.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Managers Registry Error</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          {managersRequest.error || 'Could not load operations managers.'}
        </p>
      </div>
    );
  }

  const drawerTabs = [
    { id: 'overview', label: 'Seat & Supervised Tasks', count: managerAssignments.length },
    ...(canWrite ? [{ id: 'edit', label: 'Edit Manager' }] : []),
  ];

  const canUnlinkSelectedSeat =
    Boolean(liveSelectedManager?.clientId) && numericManagerId !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Executive Manager KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Total Manager Seats"
          value={metrics.total}
          subtitle="Delegated buyer-side supervisors"
          icon={<ManagerIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Active Seats"
          value={metrics.active}
          subtitle="Authorized to review deliverables"
          icon={<ManagerIcon size={20} />}
          accentColor="var(--color-success-text)"
        />
        <KPICard
          title="Suspended Seats"
          value={metrics.suspended}
          subtitle="Portal access revoked"
          icon={<ManagerIcon size={20} />}
          accentColor="var(--color-danger-text)"
        />
        <KPICard
          title="In-Flight Supervised Tasks"
          value={metrics.totalSupervised}
          subtitle={`${assignments.length} total gig assignments tracked`}
          icon={<ProjectIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
      </div>

      {/* Filter Pills + Provision Manager Seat CTA */}
      <FilterPillBar
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
        summaryText={`Showing ${filteredManagers.length} of ${managers.length} managers`}
        rightSlot={
          canWrite ? (
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenAddModal}>
              <PlusIcon size={16} />
              <span>Add Manager Seat</span>
            </button>
          ) : undefined
        }
      />

      {/* Managers Directory */}
      <DataTable
        title="Operations Managers Registry"
        columns={columns}
        data={filteredManagers}
        searchPlaceholder="Search manager name, email, or linked organization..."
        pageSize={8}
      />

      {/* Add Manager Seat Modal */}
      <ActionModal
        isOpen={isAddModalOpen}
        onClose={() => !addSubmitting && setIsAddModalOpen(false)}
        title="Add Operations Manager Seat"
        subtitle="Provisions a manager login and attaches oversight permissions to a target client organization."
        width="500px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-manager-seat-form"
              className="admin-btn admin-btn-primary"
              disabled={addSubmitting || clientOptions.length === 0}
            >
              {addSubmitting ? 'Provisioning...' : 'Provision Manager Seat'}
            </button>
          </>
        }
      >
        <form
          id="add-manager-seat-form"
          onSubmit={handleCreateSeatSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
        >
          {addError && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
              {addError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
              Target Client Organization *
            </label>
            <select
              className="admin-select"
              value={addForm.clientId}
              onChange={(e) => setAddForm((p) => ({ ...p, clientId: e.target.value }))}
              required
            >
              <option value="" disabled>
                {clientsRequest.status === 'loading' ? 'Loading organizations...' : 'Select client organization...'}
              </option>
              {clientOptions.map((opt) => (
                <option key={opt.clientId} value={opt.clientId}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Jordan Patel"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                Work Email *
              </label>
              <input
                type="email"
                className="admin-input"
                placeholder="jordan@company.com"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
              Temporary Password (min 8 chars) *
            </label>
            <input
              type="password"
              className="admin-input"
              placeholder="Minimum 8 characters"
              value={addForm.password}
              onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
        </form>
      </ActionModal>

      {/* Manage Seat Drawer */}
      <ActionModal
        isOpen={Boolean(liveSelectedManager)}
        onClose={() => setSelectedManager(null)}
        isDrawer
        width="620px"
        title={liveSelectedManager?.name ?? 'Manager Seat'}
        subtitle={
          liveSelectedManager
            ? `${liveSelectedManager.email} · ${liveSelectedManager.clientName || liveSelectedManager.linkedClients.join(', ') || 'Unlinked'}`
            : undefined
        }
        footer={
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedManager(null)}>
            Close Seat View
          </button>
        }
      >
        {liveSelectedManager && (
          <div>
            <AdminTabs tabs={drawerTabs} activeTab={manageTab} onChange={handleTabChange} />

            {manageTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {/* Seat Overview Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Client Org</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-dark)', marginTop: '4px' }}>
                      {liveSelectedManager.clientName || liveSelectedManager.linkedClients[0] || '—'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Assignments</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '4px' }}>
                      {liveSelectedManager.activeSupervisedTasks}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Seat Status</div>
                    <div style={{ marginTop: '6px' }}>
                      <StatusBadge status={liveSelectedManager.status} />
                    </div>
                  </div>
                </div>

                {/* Seat Governance Controls */}
                {canWrite && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {liveSelectedManager.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() =>
                            setConfirmState({ open: true, kind: 'SUSPEND', manager: liveSelectedManager, loading: false })
                          }
                        >
                          Suspend Seat
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() =>
                            setConfirmState({ open: true, kind: 'ACTIVATE', manager: liveSelectedManager, loading: false })
                          }
                        >
                          Reactivate Seat
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      disabled={!canUnlinkSelectedSeat}
                      title={!canUnlinkSelectedSeat ? 'Organization linkage ID unavailable' : 'Detach manager seat from client organization'}
                      onClick={() =>
                        setConfirmState({ open: true, kind: 'UNLINK', manager: liveSelectedManager, loading: false })
                      }
                    >
                      Unlink Manager Seat
                    </button>
                  </div>
                )}

                {/* Supervised Tasks Assignment Audit */}
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                    Supervised Task Assignments ({managerAssignments.length})
                  </h4>

                  {assignmentsRequest.status === 'loading' && assignments.length === 0 ? (
                    <Loader label="Loading supervised assignments..." />
                  ) : managerAssignments.length === 0 ? (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '12px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                      No gig task supervision assignments are currently linked to this manager seat.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {managerAssignments.map((row) => (
                        <div
                          key={`${row.taskId}-${row.gigProfileId}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                #TSK-{row.taskId}
                              </span>
                              <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>
                                {row.taskTitle}
                              </strong>
                            </div>
                            <StatusBadge status={row.taskStatus} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                            <span>
                              Freelancer: <strong style={{ color: 'var(--color-text-dark)' }}>{row.gigProName}</strong> · Budget:{' '}
                              <strong style={{ color: 'var(--color-primary-dark)' }}>{formatCurrency(row.taskBudget)}</strong>
                            </span>
                            <span>Assigned {row.assignedAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {manageTab === 'edit' && canWrite && (
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {editError && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                    {editError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                    Manager Full Name *
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
                    Work Email *
                  </label>
                  <input
                    type="email"
                    className="admin-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => setManageTab('overview')}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={editSaving}>
                    {editSaving ? 'Saving...' : 'Save Manager Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </ActionModal>

      {/* Seat Governance Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        onCancel={() => !confirmState.loading && setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
        isLoading={confirmState.loading}
        isDangerous={confirmState.kind !== 'ACTIVATE'}
        confirmLabel={
          confirmState.kind === 'UNLINK'
            ? 'Unlink Manager Seat'
            : confirmState.kind === 'SUSPEND'
              ? 'Suspend Seat'
              : 'Reactivate Seat'
        }
        title={
          confirmState.kind === 'UNLINK'
            ? `Unlink ${confirmState.manager?.name ?? 'Manager'} Seat`
            : confirmState.kind === 'SUSPEND'
              ? `Suspend ${confirmState.manager?.name ?? 'Manager'}`
              : `Reactivate ${confirmState.manager?.name ?? 'Manager'}`
        }
        message={
          confirmState.kind === 'UNLINK'
            ? `Removes ${confirmState.manager?.name ?? 'this manager'}'s organization seat from ${confirmState.manager?.clientName || 'the client workspace'}. This action is recorded in the admin audit log.`
            : confirmState.kind === 'SUSPEND'
              ? 'Suspending revokes operations manager sign-in across supervised client tasks until reactivated.'
              : 'Restores manager sign-in and task supervision privileges.'
        }
      />
    </div>
  );
};

export default ManagersManagement;
