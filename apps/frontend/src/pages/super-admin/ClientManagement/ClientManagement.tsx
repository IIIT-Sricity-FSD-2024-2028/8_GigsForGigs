<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminClient } from '../../../types/super-admin';

/**
 * @file ClientManagement.tsx
 * @description
 * Client organization directory backed by real `/api/admin/clients` data.
 *
 * The old mock (`ClientDetail`) modeled KYC verification, an ACTIVE/SUSPENDED
 * status enum, totalSpent, and active/completed gig counts — none of that
 * exists on the real `Client`/`User` models (no status column on either, no
 * spend aggregation endpoint), so those actions/fields have been dropped
 * rather than faked. What IS real and wired here: list, inspect, edit
 * clientName/domain, and delete.
 */

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listClients();
        if (!cancelled) setClients(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load clients.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenClientDrawer = (client: AdminClient) => {
=======
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

  useEffect(() => {
    let isMounted = true;
    async function loadClients() {
      const data = await adminApi.getClients();
      if (isMounted) {
        setClients(data);
      }
    }
    loadClients();
    return () => { isMounted = false; };
  }, []);

  const handleOpenClientDrawer = (client: ClientDetail) => {
>>>>>>> origin/main
    setSelectedClient(client);
    setEditClientName(client.clientName);
    setEditDomain(client.domain ?? '');
    setIsEditing(false);
    setActionError(null);
    setIsDrawerOpen(true);
  };

<<<<<<< HEAD
  const handleSaveEdit = async () => {
    if (!selectedClient) return;
    setActionError(null);
    try {
      const updated = await adminApi.updateClient(selectedClient.clientId, {
        clientName: editClientName,
        domain: editDomain || undefined
      });
      setClients((prev) => prev.map((c) => (c.clientId === updated.clientId ? { ...c, ...updated } : c)));
      setSelectedClient((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditing(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update client.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    setActionError(null);
    try {
      await adminApi.deleteClient(selectedClient.clientId);
      setClients((prev) => prev.filter((c) => c.clientId !== selectedClient.clientId));
      setIsDeleteDialogOpen(false);
      setIsDrawerOpen(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete client.');
      setIsDeleteDialogOpen(false);
    }
=======
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
>>>>>>> origin/main
  };

  const columns: ColumnDef<AdminClient>[] = [
    {
      header: 'Client & Company',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.user.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.clientName}</span>
        </div>
      )
    },
    { header: 'Domain', cell: (row) => row.domain || '—' },
    { header: 'Email', cell: (row) => row.user.email },
    {
      header: 'Managers',
<<<<<<< HEAD
      cell: (row) => <span>{row.numberOfManager} seats</span>
=======
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
>>>>>>> origin/main
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

<<<<<<< HEAD
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedClient?.clientName || 'Client Details'}
        subtitle={`ID: ${selectedClient?.clientId}`}
        width="540px"
        isDrawer={true}
        footer={
          selectedClient && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Client
              </button>
              {isEditing ? (
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              ) : (
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Client
                </button>
              )}
            </div>
          )
        }
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {actionError && (
              <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
                {actionError}
              </div>
            )}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Account Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Primary Contact:</span>
                  <span style={{ fontWeight: 600 }}>{selectedClient.user.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Billing Email:</span>
                  <span>{selectedClient.user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Company Name:</span>
                  {isEditing ? (
                    <input
                      className="admin-input"
                      style={{ maxWidth: '220px' }}
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                    />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{selectedClient.clientName}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Domain:</span>
                  {isEditing ? (
                    <input
                      className="admin-input"
                      style={{ maxWidth: '220px' }}
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                    />
                  ) : (
                    <span>{selectedClient.domain || '—'}</span>
                  )}
                </div>
              </div>
=======
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
                  ${selectedClient.totalSpent.toLocaleString()}
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
>>>>>>> origin/main
            </div>
          </div>
        )}
      </ActionModal>

<<<<<<< HEAD
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to permanently delete ${selectedClient?.clientName}? This cannot be undone.`}
        confirmLabel="Delete Client"
        isDangerous={true}
=======
      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={`Suspend ${selectedClient?.companyName}?`}
        message="Suspending this client will immediately freeze all open hiring posts, pause active milestones, and restrict access for all delegated managers. This action is logged in the audit trail."
        confirmLabel="Confirm Suspension"
        isDanger={true}
        onConfirm={handleSuspendConfirm}
        onCancel={() => setIsSuspendDialogOpen(false)}
>>>>>>> origin/main
      />
    </div>
  );
};

export default ClientManagement;
