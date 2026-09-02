import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface ProjectTask {
  id: string;
  title: string;
  clientName: string;
  gigProName?: string;
  managerName?: string;
  category: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  createdAt: string;
}

export const Projects: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<ProjectTask['status']>('COMPLETED');

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getProjects();
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load projects & tasks.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenDrawer = (task: ProjectTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await adminApi.overrideProjectStatus(selectedTask.id, overrideStatus);
      const updated = tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, status: overrideStatus } : t
      );
      setTasks(updated);
      setSelectedTask({ ...selectedTask, status: overrideStatus });
      setIsOverrideModalOpen(false);
      toast.success('Task Status Overridden', `Project ${selectedTask.id} status updated to ${overrideStatus}.`);
    } catch (err: any) {
      toast.error('Override Failed', err?.message || 'Failed to update task status.');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Task Title & ID',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ID: {row.taskId || row.id}</span>
        </div>
      )
    },
    {
      header: 'Client',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.client?.clientName || row.clientName || 'Direct Client'}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{row.gigProName ? `→ ${row.gigProName}` : 'Open Bidding'}</span>
        </div>
      )
    },
    { header: 'Category', cell: (row) => row.category || 'General' },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>₹{Number(row.budget || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      cell: (row) => (row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—')
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenDrawer(row)}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Inspect
        </button>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading tasks…</div>;
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
        title="Global Project & Task Monitor"
        columns={columns}
        data={tasks}
        pageSize={6}
        searchPlaceholder="Search tasks by title or client..."
        onRowClick={handleOpenDrawer}
      />

      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedTask?.title || 'Task Details'}
        subtitle={`ID: ${selectedTask?.id} · Created: ${selectedTask ? new Date(selectedTask.createdAt).toLocaleDateString() : ''}`}
        width="540px"
        isDrawer={true}
        footer={
          selectedTask && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={() => {
                  setOverrideStatus(selectedTask.status);
                  setIsOverrideModalOpen(true);
                }}
              >
                Override Status
              </button>
            </div>
          )
        }
      >
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL BUDGET</span>
              <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                ₹{Number(selectedTask.budget).toLocaleString('en-IN')}
              </h4>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Contract Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Hiring Client:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTask.clientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned Professional:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTask.gigProName || 'Open Bidding'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Current Status:</span>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Agreed Deadline:</span>
                  <span>{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ActionModal>

      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Task Status Override"
        subtitle={`Task: ${selectedTask?.title}`}
        width="460px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOverrideStatus}>
              Confirm Override
            </button>
          </>
        }
      >
        <form onSubmit={handleOverrideStatus} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              TARGET TASK STATUS
            </label>
            <select
              className="admin-select"
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value as any)}
            >
              <option value="OPEN">Open (Re-open for Bidding)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEWING">Under Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default Projects;
