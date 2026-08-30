import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ReviewIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface GigProDetail {
  id: string;
  name: string;
  headline: string;
  category: string;
  skills: string[];
  hourlyRate: number;
  completedJobs: number;
  rating: number;
  badge: 'NONE' | 'VERIFIED_PRO' | 'TOP_RATED';
  status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  portfolioCount: number;
}

export const GigProfessionalManagement: React.FC = () => {
  const toast = useToast();
  const [gigPros, setGigPros] = useState<GigProDetail[]>([]);
  const [selectedPro, setSelectedPro] = useState<GigProDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadGigPros() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.getGigPros();
        if (isMounted) {
          setGigPros(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load gig professionals.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadGigPros();
    return () => { isMounted = false; };
  }, []);

  const handleOpenProDrawer = (pro: GigProDetail) => {
    setSelectedPro(pro);
    setIsDrawerOpen(true);
  };

  const handleUpdateBadge = async (newBadge: GigProDetail['badge']) => {
    if (!selectedPro) return;
    await adminApi.updateGigProBadge(selectedPro.id, newBadge);
    const updated = gigPros.map((p) =>
      p.id === selectedPro.id ? { ...p, badge: newBadge } : p
    );
    setGigPros(updated);
    setSelectedPro({ ...selectedPro, badge: newBadge });
    toast.success('Badge Awarded', `Updated badge to ${newBadge.replace('_', ' ')} for ${selectedPro.name}.`);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedPro) return;
    await adminApi.updateUserStatus(selectedPro.id, 'SUSPENDED', 'Quality standards review');
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
      header: 'Rate',
      cell: (row) => <span style={{ fontWeight: 700 }}>${row.hourlyRate}/hr</span>
    },
    {
      header: 'Rating & Jobs',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#bf6900', fontWeight: 700 }}>
            <ReviewIcon size={14} color="#bf6900" />
            <span>{row.rating}</span>
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            ({row.completedJobs} jobs)
          </span>
        </div>
      )
    },
    {
      header: 'Badge',
      cell: (row) => <StatusBadge status={row.badge} />
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleOpenProDrawer(row)}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
        >
          Review Talent
        </button>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading gig professionals…</div>;
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
          data={gigPros}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search talent by name, skill, or category..."
        />
      </div>

      {/* Slide-out Review Drawer */}
      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Freelancer Profile: ${selectedPro?.name}`}
        maxWidth="680px"
      >
        {selectedPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{selectedPro.name}</span>
                <StatusBadge status={selectedPro.status} />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{selectedPro.headline}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--spacing-xs)' }}>
                {selectedPro.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-white)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-dark)',
                      fontWeight: 600
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Reputation & Badging Action Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Marketplace Badging Controls
              </span>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  onClick={() => handleUpdateBadge('TOP_RATED')}
                  className="admin-btn admin-btn-primary"
                  style={{ flex: 1 }}
                >
                  👑 Award Top Rated
                </button>
                <button
                  onClick={() => handleUpdateBadge('VERIFIED_PRO')}
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1 }}
                >
                  ✓ Award Verified Pro
                </button>
                <button
                  onClick={() => handleUpdateBadge('NONE')}
                  className="admin-btn admin-btn-secondary"
                >
                  Clear Badge
                </button>
              </div>
            </div>

            {/* Moderation Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              {selectedPro.status !== 'SUSPENDED' && (
                <button
                  onClick={() => setIsSuspendDialogOpen(true)}
                  className="admin-btn admin-btn-danger"
                >
                  Suspend Freelancer
                </button>
              )}
            </div>
          </div>
        )}
      </ActionModal>

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={`Suspend ${selectedPro?.name}?`}
        message="Suspending this freelancer will prevent them from bidding on new tasks or submitting milestones. All active escrow balances will remain locked until ongoing deliverables are arbitrated."
        confirmLabel="Confirm Suspension"
        isDanger={true}
        onConfirm={handleSuspendConfirm}
        onCancel={() => setIsSuspendDialogOpen(false)}
      />
    </div>
  );
};

export default GigProfessionalManagement;
