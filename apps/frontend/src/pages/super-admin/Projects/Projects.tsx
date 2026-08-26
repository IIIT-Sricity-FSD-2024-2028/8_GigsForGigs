import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { mockProjects, type PlatformProject } from '../../../mock/adminMockData';

/**
 * @file Projects.tsx
 * @description
 * Platform-wide task and contract supervisor across all lifecycle stages.
 * Provides deep milestone inspection and emergency administrative status overrides.
 */

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<PlatformProject[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<PlatformProject | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<PlatformProject['status']>('COMPLETED');

  const handleOpenDrawer = (project: PlatformProject) => {
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const handleOverrideStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updated = projects.map((p) =>
      p.id === selectedProject.id ? { ...p, status: overrideStatus } : p
    );
    setProjects(updated);
    setSelectedProject({ ...selectedProject, status: overrideStatus });
    setIsOverrideModalOpen(false);
    alert(`Task status forcibly updated to ${overrideStatus}.`);
  };

  const columns: ColumnDef<PlatformProject>[] = [
    {
      header: 'Task Title',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ID: {row.id} · {row.category}</span>
        </div>
      )
    },
    {
      header: 'Client & Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{row.gigProName || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.budget.toLocaleString()}</span>
    },
    {
      header: 'Deliverables',
      cell: (row) => <span>{row.deliverablesSubmitted} / {row.milestonesCount} Milestones</span>
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate'
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDrawer(row);
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
        title="Global Project & Task Monitor"
        columns={columns}
        data={projects}
        pageSize={6}
        searchPlaceholder="Search tasks by title, client, or freelancer..."
        onRowClick={handleOpenDrawer}
      />

      {/* ── Project Inspector Drawer ───────────────────────────────────── */}
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedProject?.title || 'Task Details'}
        subtitle={`ID: ${selectedProject?.id} · Created: ${selectedProject?.createdAt}`}
        width="540px"
        isDrawer={true}
        footer={
          selectedProject && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={() => {
                  setOverrideStatus('CANCELLED');
                  setIsOverrideModalOpen(true);
                }}
              >
                Force Cancel & Refund
              </button>

              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={() => setIsOverrideModalOpen(true)}
              >
                Emergency Status Override
              </button>
            </div>
          )
        }
      >
        {selectedProject && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Project Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOTAL BUDGET</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  ${selectedProject.budget.toLocaleString()}
                </h4>
              </div>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>MILESTONES DELIVERED</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  {selectedProject.deliverablesSubmitted} / {selectedProject.milestonesCount}
                </h4>
              </div>
            </div>

            {/* Contract Entities */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Contract Parties
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Hiring Client:</span>
                  <span style={{ fontWeight: 600 }}>{selectedProject.clientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned Freelancer:</span>
                  <span style={{ fontWeight: 600 }}>{selectedProject.gigProName || 'Unassigned (Bidding Open)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Current Status:</span>
                  <StatusBadge status={selectedProject.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Agreed Deadline:</span>
                  <span>{selectedProject.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ActionModal>

      {/* ── Status Override Dialog ──────────────────────────────────────── */}
      <ActionModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Emergency Task Status Override"
        subtitle={`Task: ${selectedProject?.title}`}
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
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleOverrideStatus}
            >
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
              <option value="REVIEWING">Reviewing Deliverables</option>
              <option value="COMPLETED">Completed (Force Complete)</option>
              <option value="DISPUTED">Disputed (Escalate to Arbitration)</option>
              <option value="CANCELLED">Cancelled (Force Refund)</option>
            </select>
          </div>
        </form>
      </ActionModal>
    </div>
  );
};

export default Projects;
