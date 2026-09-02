import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface ClientDetail {
  id: string;
  name: string;
  companyName: string;
  email: string;
  domain: string;
  totalSpent: number;
  activeGigsCount: number;
  assignedManagersCount: number;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC';
  joinedDate: string;
}

export const ClientManagement: React.FC = () => {
  const toast = useToast();
  const [clients, setClients] = useState<ClientDetail[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadClients() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getClients();
        if (isMounted) {
          setClients(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load client directory.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadClients();
    return () => { isMounted = false; };
  }, []);

  const handleOpenClientDrawer = (client: ClientDetail) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const handleVerifyKYC = async () => {
    if (!selectedClient) return;
    await adminApi.verifyClientKYC(selectedClient.id);
    const updated = clients.map((c) =>
      c.id === selectedClient.id ? { ...c, isVerified: true, status: 'ACTIVE' as const } : c
    );
    setClients(updated);
    setSelectedClient({ ...selectedClient, isVerified: true, status: 'ACTIVE' });
    toast.success('KYC Approved', `Client ${selectedClient.name} (${selectedClient.companyName}) verified.`);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedClient) return;
    await adminApi.updateUserStatus(selectedClient.id, 'SUSPENDED', 'Compliance review');
    const updated = clients.map((c) =>
      c.id === selectedClient.id ? { ...c, status: 'SUSPENDED' as const } : c
    );
    setClients(updated);
    setIsSuspendDialogOpen(false);
    setIsDrawerOpen(false);
    toast.warning('Client Suspended', `Account for ${selectedClient.companyName} paused.`);
  };

  const columns: ColumnDef<ClientDetail>[] = [
    {
      header: 'Client & Company',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.companyName}</span>
        </div>
      )
    },
    { header: 'Domain', cell: (row) => row.domain || '—' },
    { header: 'Email', cell: (row) => row.email },
    {
      header: 'Managers',
      cell: (row) => <span>{row.assignedManagersCount} seats</span>
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
            gap: '4px'
          }}
        >
          {row.isVerified ? '✓ Verified' : '⏳ Pending KYC'}
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
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Inspect
        </button>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading clients…</div>;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
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
        title={`Client Dossier: ${selectedClient?.companyName}`}
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
                  ₹{selectedClient.totalSpent.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Delegated Managers</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>
                  {selectedClient.assignedManagersCount} Active Seats
                </div>
              </div>
            </div>

            {/* Compliance Action Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              {!selectedClient.isVerified && (
                <button
                  onClick={handleVerifyKYC}
                  className="admin-btn admin-btn-primary"
                >
                  ✓ Approve KYC Credentials
                </button>
              )}
              {selectedClient.status !== 'SUSPENDED' && (
                <button
                  onClick={() => setIsSuspendDialogOpen(true)}
                  className="admin-btn admin-btn-danger"
                >
                  Suspend Account
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
        message="Suspending this client will immediately freeze all open hiring posts, pause active milestones, and restrict access for all delegated managers. This action is logged in the audit trail."
        confirmLabel="Confirm Suspension"
        isDanger={true}
        onConfirm={handleSuspendConfirm}
        onCancel={() => setIsSuspendDialogOpen(false)}
      />
    </div>
  );
};

export default ClientManagement;
