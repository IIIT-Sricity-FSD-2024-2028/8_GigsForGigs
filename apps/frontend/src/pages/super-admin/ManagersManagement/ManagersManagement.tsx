import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminClient, AdminManager } from '../../../types/super-admin';

/**
 * @file ManagersManagement.tsx
 * @description
 * Manager directory backed by real `/api/admin/managers` + `/api/admin/clients`
 * data. The old mock's "reassign manager to a different client" action has no
 * real endpoint (`GigManagerAssignment`/`MANAGER` rows key a manager to
 * exactly one client at creation — there is no admin "move manager" route),
 * so it has been replaced with a real delete (revoke) action instead of a
 * fake reassignment. supervisedTasksCount/department were mock-only fields
 * with no backing column and have been dropped.
 */

export const ManagersManagement: React.FC = () => {
  const [managers, setManagers] = useState<AdminManager[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [targetManager, setTargetManager] = useState<AdminManager | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [managersData, clientsData] = await Promise.all([
          adminApi.listManagers(),
          adminApi.listClients()
        ]);
        if (!cancelled) {
          setManagers(managersData);
          setClients(clientsData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load managers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const managersByClientId = useMemo(() => {
    const map = new Map<number, AdminManager[]>();
    managers.forEach((m) => {
      const list = map.get(m.clientId) ?? [];
      list.push(m);
      map.set(m.clientId, list);
    });
    return map;
  }, [managers]);

  const handleRevokeConfirm = async () => {
    if (!targetManager) return;
    setActionError(null);
    try {
      await adminApi.deleteManager(targetManager.clientId, targetManager.managerId);
      setManagers((prev) =>
        prev.filter(
          (m) => !(m.clientId === targetManager.clientId && m.managerId === targetManager.managerId)
        )
      );
      setIsRevokeDialogOpen(false);
      setTargetManager(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to revoke manager.');
      setIsRevokeDialogOpen(false);
    }
  };

  const columns: ColumnDef<AdminManager>[] = [
    {
      header: 'Manager Name',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.user.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.user.email}</span>
        </div>
      )
    },
    {
      header: 'Linked Client Organization',
      cell: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{row.client.clientName}</span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setActionError(null);
            setTargetManager(row);
            setIsRevokeDialogOpen(true);
          }}
        >
          Revoke
        </button>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading managers…</div>;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {actionError && (
        <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
          {actionError}
        </div>
      )}

      {/* ── Client-Manager Organizational Visualizer ─────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
          Client → Manager Organizational Hierarchy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {clients.map((client) => {
            const orgManagers = managersByClientId.get(client.clientId) ?? [];
            return (
              <div
                key={client.clientId}
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-light)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {client.clientName}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {orgManagers.length} Managers
                  </span>
                </div>
                {orgManagers.length > 0 ? (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-xs)' }}>
                    {orgManagers.map((m) => (
                      <li key={m.managerId} style={{ color: 'var(--color-text-dark)' }}>
                        • {m.user.name}
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

      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => setIsRevokeDialogOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Manager Access"
        message={`Are you sure you want to revoke ${targetManager?.user.name}'s manager role for ${targetManager?.client.clientName}? This cannot be undone.`}
        confirmLabel="Revoke Manager"
        isDangerous={true}
      />
    </div>
  );
};

export default ManagersManagement;
