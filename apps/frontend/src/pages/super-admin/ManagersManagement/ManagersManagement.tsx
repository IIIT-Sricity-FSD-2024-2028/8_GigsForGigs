import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { mockManagers, mockClients, type ManagerDetail } from '../../../mock/adminMockData';

/**
 * @file ManagersManagement.tsx
 * @description
 * Intermediate Project Manager governance and client organization linkage visualizer.
 * Enforces RBAC restrictions (ensuring managers cannot post tasks or initiate escrow disbursements).
 */

export const ManagersManagement: React.FC = () => {
  const [managers, setManagers] = useState<ManagerDetail[]>(mockManagers);
  const [selectedManager, setSelectedManager] = useState<ManagerDetail | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState('');

  const handleOpenReassignModal = (manager: ManagerDetail) => {
    setSelectedManager(manager);
    setNewClientId(manager.linkedClientId);
    setIsReassignModalOpen(true);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    const targetClient = mockClients.find((c) => c.id === newClientId);
    if (!targetClient) return;

    const updated = managers.map((m) =>
      m.id === selectedManager.id
        ? { ...m, linkedClientId: targetClient.id, linkedClientName: targetClient.companyName }
        : m
    );
    setManagers(updated);
    setIsReassignModalOpen(false);
    alert(`Reassigned manager ${selectedManager.name} to ${targetClient.companyName}.`);
  };

  const columns: ColumnDef<ManagerDetail>[] = [
    {
      header: 'Manager Name',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Linked Client Organization',
      cell: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
          {row.linkedClientName}
        </span>
      )
    },
    { header: 'Department', accessorKey: 'department' },
    {
      header: 'Supervised Tasks',
      cell: (row) => <span>{row.supervisedTasksCount} Active Gigs</span>
    },
    {
      header: 'RBAC Authorization',
      cell: () => (
        <span className="admin-badge badge-info" title="Verified: Cannot post tasks or trigger payouts">
          Review Only (No Post)
        </span>
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
            handleOpenReassignModal(row);
          }}
        >
          Reassign Client
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* ── Client-Manager Organizational Visualizer ─────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
          Client $\rightarrow$ Manager Organizational Hierarchy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {mockClients.map((client) => {
            const orgManagers = managers.filter((m) => m.linkedClientId === client.id);
            return (
              <div
                key={client.id}
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-light)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {client.companyName}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {orgManagers.length} Managers
                  </span>
                </div>
                {orgManagers.length > 0 ? (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-xs)' }}>
                    {orgManagers.map((m) => (
                      <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dark)' }}>
                        <span>• {m.name}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{m.supervisedTasksCount} tasks</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No delegated managers assigned
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Master Managers Table ───────────────────────────────────────── */}
      <DataTable
        title="Manager Personnel Directory"
        columns={columns}
        data={managers}
        pageSize={6}
        searchPlaceholder="Search managers by name, email, or client..."
      />

      {/* ── Reassign Modal ──────────────────────────────────────────────── */}
      <ActionModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`Reassign Manager: ${selectedManager?.name}`}
        subtitle="Transfer manager oversight permissions to a different client organization."
        width="480px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsReassignModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleReassignSubmit}
            >
              Save Linkage
            </button>
          </>
        }
      >
        <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              TARGET CLIENT ORGANIZATION
            </label>
            <select
              className="admin-select"
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
            >
              {mockClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.name})
                </option>
              ))}
            </select>
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default ManagersManagement;
