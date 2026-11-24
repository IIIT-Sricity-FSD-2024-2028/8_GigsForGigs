import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchClients,
  decideClientKYC,
  updateUserStatus
} from '../../../store/admin/adminSlice';
import {
  selectClients,
  selectClientsRequest
} from '../../../store/admin/selectors';
import type { ClientDetail } from '../../../store/admin/types';
import { formatCurrency } from '../../../utils/format';
import { extractErrorMessage } from '../../../utils/adminAccess';

export type { ClientDetail };

export const ClientManagement: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const clients = useAppSelector(selectClients);
  const clientsRequest = useAppSelector(selectClientsRequest);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleOpenClientDrawer = (client: ClientDetail) => {
    setSelectedClientId(client.id);
    setIsDrawerOpen(true);
  };

  /** Records the decision, updating Redux only once the server/DB accepts it. */
  const handleKycDecision = async (decision: 'VERIFIED' | 'REJECTED') => {
    if (!selectedClient) return;
    try {
      await dispatch(decideClientKYC({ clientId: selectedClient.id, status: decision })).unwrap();
      toast.success(
        decision === 'VERIFIED' ? 'KYC Approved' : 'KYC Rejected',
        `Decision recorded for ${selectedClient.companyName}.`
      );
    } catch (err: unknown) {
      toast.error('KYC Update Failed', extractErrorMessage(err, 'Could not record the KYC decision.'));
    }
  };

  const handleSuspendConfirm = async () => {
    if (!selectedClient) return;
    try {
      await dispatch(
        updateUserStatus({
          userId: selectedClient.id,
          status: 'SUSPENDED',
          reason: 'Compliance review'
        })
      ).unwrap();
      setIsDrawerOpen(false);
      toast.warning('Client Suspended', `Account for ${selectedClient.companyName} paused.`);
    } catch (err: unknown) {
      toast.error('Suspension Failed', extractErrorMessage(err, 'Could not suspend this client.'));
    }
    setIsSuspendDialogOpen(false);
  };

  const handleReactivateClient = async () => {
    if (!selectedClient) return;
    try {
      await dispatch(
        updateUserStatus({
          userId: selectedClient.id,
          status: 'ACTIVE',
          reason: 'Reactivated by Admin'
        })
      ).unwrap();
      toast.success('Client Reactivated', `Account for ${selectedClient.companyName} restored to Active.`);
    } catch (err: unknown) {
      toast.error('Reactivation Failed', extractErrorMessage(err, 'Could not reactivate client.'));
    }
  };

  const columns: ColumnDef<ClientDetail>[] = [
    {
      header: 'Client & Company',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '190px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.companyName}</span>
        </div>
      )
    },
    {
      header: 'Contact & Domain',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '210px' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', wordBreak: 'break-word' }}>{row.email}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.domain || '—'}</span>
        </div>
      )
    },
    {
      header: 'Managers',
      cell: (row) => <span style={{ whiteSpace: 'nowrap' }}>{row.assignedManagersCount} seats</span>
    },
    {
      header: 'KYC Status',
      cell: (row) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: row.isVerified ? 'var(--color-success-text)' : 'var(--color-warning-text)',
            backgroundColor: row.isVerified ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          {row.kycStatus === 'VERIFIED' ? '✓ Verified' : row.kycStatus === 'REJECTED' ? '✕ Rejected' : '⏳ Pending KYC'}
        </span>
      )
    },
    {
      header: 'Account Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenClientDrawer(row)}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}
        >
          Inspect
        </button>
      )
    }
  ];

  if (clientsRequest.status === 'loading' && clients.length === 0) {
    return <Loader label="Loading clients..." />;
  }

  if (clientsRequest.error && clients.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {clientsRequest.error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={clients}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search clients by name, company, or domain..."
        />
      </div>

      {/* Slide-out Inspection Drawer */}
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Client Dossier: ${selectedClient?.companyName || ''}`}
        maxWidth="640px"
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Primary Contact</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{selectedClient.name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-dark)' }}>{selectedClient.email}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Organization Status</span>
                <div><StatusBadge status={selectedClient.status} /></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Lifetime Platform Spend</span>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary-dark)' }}>
                  {formatCurrency(selectedClient.totalSpent)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Delegated Managers</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>
                  {selectedClient.assignedManagersCount} {selectedClient.assignedManagersCount === 1 ? 'Seat' : 'Seats'}
                </div>
                {selectedClient.managers.map((m) => (
                  <div key={m.managerId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {m.name} ({m.email}) · {m.status}
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Action Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              {selectedClient.kycStatus !== 'VERIFIED' && (
                <button onClick={() => handleKycDecision('VERIFIED')} className="admin-btn admin-btn-primary">
                  ✓ Approve KYC
                </button>
              )}
              {selectedClient.kycStatus !== 'REJECTED' && (
                <button onClick={() => handleKycDecision('REJECTED')} className="admin-btn admin-btn-secondary">
                  ✕ Reject KYC
                </button>
              )}
              {selectedClient.status !== 'SUSPENDED' ? (
                <button
                  onClick={() => setIsSuspendDialogOpen(true)}
                  className="admin-btn admin-btn-danger"
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={handleReactivateClient}
                  className="admin-btn admin-btn-primary"
                >
                  Reactivate Account
                </button>
              )}
            </div>
          </div>
        )}
      </ActionModal>

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={`Suspend ${selectedClient?.companyName}?`}
        message="This signs the client out on their next request and blocks new logins. Their tasks, managers and escrow are left exactly as they are, and reactivating restores access."
        confirmLabel="Confirm Suspension"
        isDanger={true}
        onConfirm={handleSuspendConfirm}
        onCancel={() => setIsSuspendDialogOpen(false)}
      />
    </div>
  );
};

export default ClientManagement;
