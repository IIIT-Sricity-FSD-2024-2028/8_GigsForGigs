import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface PlatformProject {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  gigProName?: string;
  gigProId?: string;
  managerName?: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  category: string;
  deliverablesCount: number;
  submittedDeliverables: number;
  createdAt: string;
  dueDate: string;
}

export const Projects: React.FC = () => {
  const toast = useToast();
  const [projects, setProjects] = useState<PlatformProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PlatformProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      const data = await adminApi.getProjects();
      if (isMounted) {
        setProjects(data);
      }
    }
    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const handleOpenModal = (p: PlatformProject) => {
    setSelectedProject(p);
    setIsModalOpen(true);
  };

  const handleOverrideStatus = (newStatus: PlatformProject['status']) => {
    if (!selectedProject) return;
    const updated = projects.map((p) =>
      p.id === selectedProject.id ? { ...p, status: newStatus } : p
    );
    setProjects(updated);
    setSelectedProject({ ...selectedProject, status: newStatus });
    toast.info('Status Overridden', `Project ${selectedProject.id} status changed to ${newStatus}.`);
  };

  const columns: ColumnDef<PlatformProject>[] = [
    {
      header: 'Task Title & ID',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.title}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</span>
        </div>
      )
    },
    {
      header: 'Client $\\rightarrow$ Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{row.clientName}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>$\\rightarrow$ {row.gigProName || 'Open Bidding'}</span>
        </div>
      )
    },
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Budget',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>${row.budget.toLocaleString()}</span>
    },
    {
      header: 'Milestone Progress',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(row.submittedDeliverables / (row.deliverablesCount || 1)) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary-blue)'
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {row.submittedDeliverables}/{row.deliverablesCount}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Inspect
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={projects}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search projects by title, client, or category..."
        />
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Task Monitor: ${selectedProject?.title}`}
        maxWidth="640px"
      >
        {selectedProject && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Budget</span>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary-dark)' }}>
                  ${selectedProject.budget.toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <div><StatusBadge status={selectedProject.status} /></div>
              </div>
            </div>

            {/* Emergency Status Override Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Emergency Administrative Status Override
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                <button
                  onClick={() => handleOverrideStatus('COMPLETED')}
                  className="admin-btn admin-btn-primary"
                >
                  Force Complete
                </button>
                <button
                  onClick={() => handleOverrideStatus('DISPUTED')}
                  className="admin-btn admin-btn-warning"
                >
                  Elevate to Dispute
                </button>
                <button
                  onClick={() => handleOverrideStatus('CANCELLED')}
                  className="admin-btn admin-btn-danger"
                >
                  Cancel Contract
                </button>
              </div>
            </div>
          </div>
        )}
      </ActionModal>
    </div>
  );
};

export default Projects;
