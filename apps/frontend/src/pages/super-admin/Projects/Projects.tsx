import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminTask, TaskStatus } from '../../../types/super-admin';

/**
 * @file Projects.tsx
 * @description
 * Platform-wide task monitor backed by real `/api/admin/tasks` data.
 *
 * The real `TaskStatus` enum is only `open | in_progress | completed` — the
 * mock's REVIEWING/ASSIGNED/DISPUTED/CANCELLED statuses and milestone/
 * deliverables-submitted counters don't exist on the schema, so the status
 * override dropdown only offers the three real values and the milestone
 * counters have been dropped rather than faked.
 */

export const Projects: React.FC = () => {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<TaskStatus>('completed');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listTasks();
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load tasks.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenDrawer = (task: AdminTask) => {
    setSelectedTask(task);
    setActionError(null);
    setIsDrawerOpen(true);
  };

  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionError(null);
    try {
      const updated = await adminApi.updateTask(selectedTask.taskId, { status: overrideStatus });
      setTasks((prev) => prev.map((t) => (t.taskId === updated.taskId ? { ...t, ...updated } : t)));
      setSelectedTask((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsOverrideModalOpen(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update task status.');
    }
  };

  const columns: ColumnDef<AdminTask>[] = [
    {
      header: 'Task Title & ID',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ID: {row.taskId}</span>
        </div>
      )
    },
    {
      header: 'Client',
      cell: (row) => <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.client.clientName}</span>
    },
    { header: 'Category', cell: (row: any) => row.category || 'General' },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${Number(row.budget).toLocaleString()}</span>
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
        subtitle={`ID: ${selectedTask?.taskId} · Created: ${selectedTask ? new Date(selectedTask.createdAt).toLocaleDateString() : ''}`}
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
            {actionError && (
              <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
                {actionError}
              </div>
            )}
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL BUDGET</span>
              <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                ${Number(selectedTask.budget).toLocaleString()}
              </h4>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Contract Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Hiring Client:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTask.client.clientName}</span>
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
              onChange={(e) => setOverrideStatus(e.target.value as TaskStatus)}
            >
              <option value="open">Open (Re-open for Bidding)</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default Projects;
