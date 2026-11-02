import React, { useEffect, useState } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ArrowRightIcon } from '../../../components/super-admin/Icons';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface ProjectTask {
  id: string;
  title: string;
  clientName: string;
  gigProName?: string;
  managerName?: string | null;
  category: string | null;
  budget: number;
  platformFee: number | null;
  escrowStatus: string | null;
  deliverablesCount: number;
  deliverablesApproved: number;
  applicationsCount: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string | null;
  createdAt: string;
}

export const Projects: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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
          <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {row.gigProName ? (
              <>
                <ArrowRightIcon size={11} color="var(--color-text-muted)" /> {row.gigProName}
              </>
            ) : (
              'Open Bidding'
            )}
          </span>
        </div>
      )
    },
    { header: 'Category', cell: (row) => row.category || '—' },
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
    return <Loader label="Loading tasks..." />;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return (t.status || '').toUpperCase() === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Status Filter Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`admin-btn ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ padding: '5px 14px', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        title="Global Project & Task Monitor"
        columns={columns}
        data={filteredTasks}
        pageSize={6}
        searchPlaceholder="Search tasks by title, client, or category..."
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
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>GIG BUDGET</span>
              <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                ₹{Number(selectedTask.budget).toLocaleString('en-IN')}
              </h4>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {selectedTask.escrowStatus
                  ? `Escrow: ${selectedTask.escrowStatus.replace(/_/g, ' ')} · Fee ₹${Number(selectedTask.platformFee).toLocaleString('en-IN')}`
                  : 'Escrow: no contract yet'}
              </span>
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
                  <span style={{ fontWeight: 600 }}>{selectedTask.gigProName || `Open (${selectedTask.applicationsCount} applications)`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Supervised By:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTask.managerName || 'Client (no manager)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Deliverables:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTask.deliverablesApproved} approved of {selectedTask.deliverablesCount} submitted</span>
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
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default Projects;
