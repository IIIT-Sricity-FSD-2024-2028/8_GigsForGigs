import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
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
    setSelectedClient(client);
    setEditClientName(client.clientName);
    setEditDomain(client.domain ?? '');
    setIsEditing(false);
    setActionError(null);
    setIsDrawerOpen(true);
  };

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
      cell: (row) => <span>{row.numberOfManager} seats</span>
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
      <DataTable
        title="Client Organization Directory"
        columns={columns}
        data={clients}
        pageSize={6}
        searchPlaceholder="Search by client name, email, or company..."
        onRowClick={handleOpenClientDrawer}
      />

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
            </div>
          </div>
        )}
      </ActionModal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to permanently delete ${selectedClient?.clientName}? This cannot be undone.`}
        confirmLabel="Delete Client"
        isDangerous={true}
      />
    </div>
  );
};

export default ClientManagement;
