import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface ManagerDetail {
  id: string;
  name: string;
  email: string;
  linkedClients: string[];
  activeSupervisedTasks: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export const ManagersManagement: React.FC = () => {
  const toast = useToast();
  const [managers, setManagers] = useState<ManagerDetail[]>([]);
  const [selectedManager, setSelectedManager] = useState<ManagerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadManagers() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getManagers();
        if (isMounted) {
          setManagers(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load managers directory.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadManagers();
    return () => { isMounted = false; };
  }, []);

  const handleOpenManagerModal = (mgr: ManagerDetail) => {
    setSelectedManager(mgr);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedManager) return;
    const newStatus: 'ACTIVE' | 'SUSPENDED' = selectedManager.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(selectedManager.id, newStatus, 'Manager status updated');
      const updated = managers.map((m) =>
        m.id === selectedManager.id ? { ...m, status: newStatus } : m
      );
      setManagers(updated);
      setSelectedManager({ ...selectedManager, status: newStatus });
      toast.success('Status Updated', `Manager seat for ${selectedManager.name} is now ${newStatus}.`);
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update manager status.');
    }
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
      header: 'Client Organizations',
      cell: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.linkedClients.map((client) => (
            <span
              key={client}
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-light)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary-dark)',
                fontWeight: 600
              }}
            >
              {client}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Supervised Tasks',
      cell: (row) => <span style={{ fontWeight: 700 }}>{row.activeSupervisedTasks} In Progress</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenManagerModal(row)}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Manage
        </button>
      )
    }
  ];

  if (loading) {
    return <Loader label="Loading managers..." />;
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
          data={managers}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search managers by name, client, or department..."
        />
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manager Permissions: ${selectedManager?.name}`}
        maxWidth="580px"
      >
        {selectedManager && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{selectedManager.name}</span>
                <StatusBadge status={selectedManager.status} />
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{selectedManager.email} • {selectedManager.activeSupervisedTasks} tasks in progress stay assigned if suspended, and the client can reassign them</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              <button
                onClick={handleToggleStatus}
                className={`admin-btn ${selectedManager.status === 'ACTIVE' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
              >
                {selectedManager.status === 'ACTIVE' ? 'Suspend Manager Seat' : 'Reactivate Manager Seat'}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ActionModal>
    </div>
  );
};

export default ManagersManagement;
