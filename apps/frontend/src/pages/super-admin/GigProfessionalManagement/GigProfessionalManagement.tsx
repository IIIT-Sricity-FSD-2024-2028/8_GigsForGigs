import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ReviewIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/useToast';
import { safeHttpUrl } from '../../../utils/safeUrl';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchGigPros,
  updateGigProBadge,
  updateUserStatus
} from '../../../store/admin/adminSlice';
import {
  selectGigPros,
  selectGigProsRequest
} from '../../../store/admin/selectors';
import type { GigProDetail } from '../../../store/admin/types';
import { formatCurrency } from '../../../utils/format';
import { extractErrorMessage } from '../../../utils/adminAccess';

export type { GigProDetail };

export const GigProfessionalManagement: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const gigPros = useAppSelector(selectGigPros);
  const gigProsRequest = useAppSelector(selectGigProsRequest);

  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const selectedPro = gigPros.find((p) => p.id === selectedProId) || null;

  useEffect(() => {
    dispatch(fetchGigPros());
  }, [dispatch]);

  const handleOpenProDrawer = (pro: GigProDetail) => {
    setSelectedProId(pro.id);
    setIsDrawerOpen(true);
  };

  const handleUpdateBadge = async (newBadge: GigProDetail['badge']) => {
    if (!selectedPro) return;
    try {
      await dispatch(updateGigProBadge({ gigProId: selectedPro.id, badge: newBadge })).unwrap();
      toast.success('Badge Updated', `Badge set to ${newBadge.replace('_', ' ')} for ${selectedPro.name}.`);
    } catch (err: unknown) {
      toast.error('Badge Update Failed', extractErrorMessage(err, 'Could not update the badge.'));
    }
  };

  const handleSuspendConfirm = async () => {
    if (!selectedPro) return;
    try {
      await dispatch(
        updateUserStatus({
          userId: selectedPro.id,
          status: 'SUSPENDED',
          reason: 'Quality standards review'
        })
      ).unwrap();
      setIsDrawerOpen(false);
      toast.warning('Freelancer Suspended', `Account for ${selectedPro.name} paused.`);
    } catch (err: unknown) {
      toast.error('Suspension Failed', extractErrorMessage(err, 'Could not suspend this account.'));
    }
    setIsSuspendDialogOpen(false);
  };

  const handleReactivatePro = async () => {
    if (!selectedPro) return;
    try {
      await dispatch(
        updateUserStatus({
          userId: selectedPro.id,
          status: 'ACTIVE',
          reason: 'Reactivated by Admin'
        })
      ).unwrap();
      toast.success('Freelancer Reactivated', `Account for ${selectedPro.name} restored to Active.`);
    } catch (err: unknown) {
      toast.error('Reactivation Failed', extractErrorMessage(err, 'Could not reactivate freelancer.'));
    }
  };

  const columns: ColumnDef<GigProDetail>[] = [
    {
      header: 'Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '210px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.skills.slice(0, 3).join(', ') || 'No skills listed'}</span>
        </div>
      )
    },
    {
      header: 'Earnings',
      cell: (row) => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(row.totalEarnings)}</span>
    },
    {
      header: 'Rating & Jobs',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9A5100', fontWeight: 700 }}>
            <ReviewIcon size={14} color="#9A5100" />
            <span>{row.rating ?? '—'}</span>
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
            {row.reviewCount} reviews · {row.completedJobs} jobs
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
          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}
        >
          Review Talent
        </button>
      )
    }
  ];

  if (gigProsRequest.status === 'loading' && gigPros.length === 0) {
    return <Loader label="Loading gig professionals..." />;
  }

  if (gigProsRequest.error && gigPros.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {gigProsRequest.error}
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
        title={`Freelancer Profile: ${selectedPro?.name || ''}`}
        maxWidth="680px"
      >
        {selectedPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{selectedPro.name}</span>
                <StatusBadge status={selectedPro.status} />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{selectedPro.headline || 'No bio provided'}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--spacing-xs)' }}>
                {selectedPro.skills.map((skill: string) => (
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
              <div style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
                <strong>Portfolio ({selectedPro.portfolioUrls.length}):</strong>{' '}
                {selectedPro.portfolioUrls.length === 0 && 'none submitted'}
                {selectedPro.portfolioUrls.map((url: string) => (
                  <div key={url}>
                    <a href={safeHttpUrl(url)} target="_blank" rel="noreferrer">{url}</a>
                  </div>
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
              {selectedPro.status !== 'SUSPENDED' ? (
                <button
                  onClick={() => setIsSuspendDialogOpen(true)}
                  className="admin-btn admin-btn-danger"
                >
                  Suspend Freelancer
                </button>
              ) : (
                <button
                  onClick={handleReactivatePro}
                  className="admin-btn admin-btn-primary"
                >
                  Reactivate Freelancer
                </button>
              )}
            </div>
          </div>
        )}
      </ActionModal>

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={`Suspend ${selectedPro?.name || ''}?`}
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
