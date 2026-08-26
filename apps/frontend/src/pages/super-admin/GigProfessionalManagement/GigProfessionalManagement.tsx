import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { ReviewIcon } from '../../../components/super-admin/Icons';
import { mockGigPros, type GigProDetail } from '../../../mock/adminMockData';

/**
 * @file GigProfessionalManagement.tsx
 * @description
 * Freelancer talent directory, identity verification, badge approvals, and moderation.
 * Allows Super Admins to award "Verified Pro" / "Top Rated" badges, inspect portfolios,
 * and enforce marketplace quality standards.
 */

import { useToast } from '../../../components/super-admin/Toast';

export const GigProfessionalManagement: React.FC = () => {
  const toast = useToast();
  const [gigPros, setGigPros] = useState<GigProDetail[]>(mockGigPros);
  const [selectedPro, setSelectedPro] = useState<GigProDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const handleOpenProDrawer = (pro: GigProDetail) => {
    setSelectedPro(pro);
    setIsDrawerOpen(true);
  };

  const handleUpdateBadge = (newBadge: GigProDetail['badge']) => {
    if (!selectedPro) return;
    const updated = gigPros.map((p) =>
      p.id === selectedPro.id ? { ...p, badge: newBadge } : p
    );
    setGigPros(updated);
    setSelectedPro({ ...selectedPro, badge: newBadge });
    toast.success('Badge Awarded', `Updated badge to ${newBadge.replace('_', ' ')} for ${selectedPro.name}.`);
  };

  const handleSuspendConfirm = () => {
    if (!selectedPro) return;
    const updated = gigPros.map((p) =>
      p.id === selectedPro.id ? { ...p, status: 'SUSPENDED' as const } : p
    );
    setGigPros(updated);
    setIsSuspendDialogOpen(false);
    setIsDrawerOpen(false);
    toast.warning('Freelancer Suspended', `Account for ${selectedPro.name} paused.`);
  };

  const columns: ColumnDef<GigProDetail>[] = [
    {
      header: 'Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.headline}</span>
        </div>
      )
    },
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Rating & Feedback',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ReviewIcon size={14} color="#bf6900" />
          <span style={{ fontWeight: 700 }}>{row.rating.toFixed(2)}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>({row.reviewsCount})</span>
        </div>
      )
    },
    {
      header: 'Rate',
      cell: (row) => <span>${row.hourlyRate}/hr</span>
    },
    {
      header: 'Earnings',
      cell: (row) => <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>${row.totalEarnings.toLocaleString()}</span>
    },
    {
      header: 'Tier & Badge',
      cell: (row) => <StatusBadge status={row.badge} />
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenProDrawer(row);
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
        title="Gig Professional Talent Directory"
        columns={columns}
        data={gigPros}
        pageSize={6}
        searchPlaceholder="Search freelancers by skill, name, or category..."
        onRowClick={handleOpenProDrawer}
      />

      {/* ── Freelancer Inspector Drawer ────────────────────────────────── */}
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedPro?.name || 'Freelancer Profile'}
        subtitle={selectedPro?.headline}
        width="560px"
        isDrawer={true}
        footer={
          selectedPro && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={() => setIsSuspendDialogOpen(true)}
              >
                Suspend Freelancer
              </button>

              <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => handleUpdateBadge('VERIFIED_PRO')}
                >
                  Award Verified Pro
                </button>
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => handleUpdateBadge('TOP_RATED')}
                >
                  Award Top Rated
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Financial & Completion Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>LIFETIME EARNINGS</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  ${selectedPro.totalEarnings.toLocaleString()}
                </h4>
              </div>
              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>COMPLETED PROJECTS</span>
                <h4 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  {selectedPro.completedProjectsCount} Tasks
                </h4>
              </div>
            </div>

            {/* Skills Taxonomy */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Verified Skill Tags
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPro.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(8, 75, 131, 0.08)',
                      color: 'var(--color-primary-dark)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification Metadata */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Platform Compliance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Email Contact:</span>
                  <span>{selectedPro.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Active Tier Badge:</span>
                  <StatusBadge status={selectedPro.badge} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Marketplace Member Since:</span>
                  <span>{selectedPro.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ActionModal>

      {/* ── Suspend Confirmation Dialog ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        onClose={() => setIsSuspendDialogOpen(false)}
        onConfirm={handleSuspendConfirm}
        title="Suspend Freelancer Profile"
        message={`Are you sure you want to suspend ${selectedPro?.name}? The freelancer will be blocked from submitting proposals or receiving new milestone contracts.`}
        confirmLabel="Suspend Freelancer"
        isDangerous={true}
      />
    </div>
  );
};

export default GigProfessionalManagement;
