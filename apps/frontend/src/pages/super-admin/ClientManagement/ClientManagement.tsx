import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { mockClients, type ClientDetail } from '../../../mock/adminMockData';

/**
 * @file ClientManagement.tsx
 * @description
 * Client directory and compliance governance view.
 * Features KYC verification approvals, spend analytics inspection, manager assignment links,
 * and account suspension controls.
 */

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientDetail[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const handleOpenClientDrawer = (client: ClientDetail) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const handleVerifyKYC = () => {
    if (!selectedClient) return;
    const updated = clients.map((c) =>
      c.id === selectedClient.id ? { ...c, isVerified: true, status: 'ACTIVE' as const } : c
    );
    setClients(updated);
    setSelectedClient({ ...selectedClient, isVerified: true, status: 'ACTIVE' });
    alert(`Client ${selectedClient.name} KYC verified successfully.`);
  };

  const handleSuspendConfirm = () => {
    if (!selectedClient) return;
    const updated = clients.map((c) =>
      c.id === selectedClient.id ? { ...c, status: 'SUSPENDED' as const } : c
    );
    setClients(updated);
    setIsSuspendDialogOpen(false);
    setIsDrawerOpen(false);
    alert(`Client ${selectedClient.companyName} suspended. All active hiring operations paused.`);
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
    { header: 'Domain', accessorKey: 'domain' },
    {
      header: 'Total Spend',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.totalSpent.toLocaleString()}</span>
    },
    {
      header: 'Active Gigs',
      cell: (row) => <span>{row.activeGigsCount} in-flight</span>
    },
    {
      header: 'Managers',
      cell: (row) => <span>{row.assignedManagersCount} seats</span>
    },
    {
      header: 'KYC & Status',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <StatusBadge status={row.status} />
          {row.isVerified && <span className="admin-badge badge-success">KYC Verified</span>}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenClientDrawer(row);
          }}
        >
          Inspect
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <DataTable
        title="Client Organization Directory"
        columns={columns}
        data={clients}
        pageSize={6}
        searchPlaceholder="Search by client name, email, or company..."
        onRowClick={handleOpenClientDrawer}
      />

      {/* ── Client Detail Inspector Drawer ──────────────────────────────── */}
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedClient?.companyName || 'Client Details'}
        subtitle={`ID: ${selectedClient?.id} · Member since ${selectedClient?.createdAt}`}
        width="540px"
        isDrawer={true}
        footer={
          selectedClient && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              {selectedClient.status !== 'SUSPENDED' ? (
                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => setIsSuspendDialogOpen(true)}
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => {
                    const updated = clients.map((c) =>
                      c.id === selectedClient.id ? { ...c, status: 'ACTIVE' as const } : c
                    );
                    setClients(updated);
                    setSelectedClient({ ...selectedClient, status: 'ACTIVE' });
                  }}
                >
                  Reactivate Account
                </button>
              )}

              {!selectedClient.isVerified && (
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={handleVerifyKYC}
                >
                  Approve KYC Verification
                </button>
              )}
            </div>
          )
        }
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Primary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>CUMULATIVE SPEND</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  ${selectedClient.totalSpent.toLocaleString()}
                </h4>
              </div>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>COMPLETED CONTRACTS</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  {selectedClient.completedGigsCount}
                </h4>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Account Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Primary Contact:</span>
                  <span style={{ fontWeight: 600 }}>{selectedClient.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Billing Email:</span>
                  <span>{selectedClient.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Industry / Domain:</span>
                  <span>{selectedClient.domain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned Managers:</span>
                  <span style={{ fontWeight: 600 }}>{selectedClient.assignedManagersCount} Managers</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ActionModal>

      {/* ── Suspend Confirmation Dialog ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        onClose={() => setIsSuspendDialogOpen(false)}
        onConfirm={handleSuspendConfirm}
        title="Suspend Client Account"
        message={`Are you sure you want to suspend ${selectedClient?.companyName}? All active job postings will be paused and hiring contracts frozen.`}
        confirmLabel="Suspend Account"
        isDangerous={true}
      />
    </div>
  );
};

export default ClientManagement;
