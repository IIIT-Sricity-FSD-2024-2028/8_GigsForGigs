<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminGigProfile } from '../../../types/super-admin';

/**
 * @file GigProfessionalManagement.tsx
 * @description
 * Freelancer directory backed by real `/api/admin/gig-profiles` data.
 *
 * The old mock (`GigProDetail`) modeled hourlyRate, rating, reviewsCount,
 * totalEarnings, completedProjectsCount, a TOP_RATED/VERIFIED_PRO badge tier,
 * and an ACTIVE/SUSPENDED status — none of that exists on the real
 * `GigProfessionalProfile`/`User` models (no rate/earnings/status columns;
 * ratings live on `Review` rows per-task, not aggregated per-profile
 * anywhere), so badge-award/suspend actions and those metrics have been
 * dropped rather than faked. What IS real and wired here: list, inspect,
 * edit bio, and delete.
 */

export const GigProfessionalManagement: React.FC = () => {
  const [gigPros, setGigPros] = useState<AdminGigProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedPro, setSelectedPro] = useState<AdminGigProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listGigProfiles();
        if (!cancelled) setGigPros(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load gig professionals.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenProDrawer = (pro: AdminGigProfile) => {
=======
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

  useEffect(() => {
    let isMounted = true;
    async function loadGigPros() {
      const data = await adminApi.getGigPros();
      if (isMounted) {
        setGigPros(data);
      }
    }
    loadGigPros();
    return () => { isMounted = false; };
  }, []);

  const handleOpenProDrawer = (pro: GigProDetail) => {
>>>>>>> origin/main
    setSelectedPro(pro);
    setEditBio(pro.bio ?? '');
    setIsEditing(false);
    setActionError(null);
    setIsDrawerOpen(true);
  };

<<<<<<< HEAD
  const handleSaveEdit = async () => {
    if (!selectedPro) return;
    setActionError(null);
    try {
      const updated = await adminApi.updateGigProfile(selectedPro.gigProfileId, { bio: editBio });
      setGigPros((prev) =>
        prev.map((p) => (p.gigProfileId === updated.gigProfileId ? { ...p, ...updated } : p))
      );
      setSelectedPro((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditing(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPro) return;
    setActionError(null);
    try {
      await adminApi.deleteGigProfile(selectedPro.gigProfileId);
      setGigPros((prev) => prev.filter((p) => p.gigProfileId !== selectedPro.gigProfileId));
      setIsDeleteDialogOpen(false);
      setIsDrawerOpen(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete profile.');
      setIsDeleteDialogOpen(false);
    }
=======
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
>>>>>>> origin/main
  };

  const columns: ColumnDef<AdminGigProfile>[] = [
    {
      header: 'Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.user.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.bio || 'No bio yet'}</span>
        </div>
      )
    },
<<<<<<< HEAD
    { header: 'Email', cell: (row) => row.user.email },
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
      <DataTable
        title="Gig Professional Talent Directory"
        columns={columns}
        data={gigPros}
        pageSize={6}
        searchPlaceholder="Search freelancers by name, email, or bio..."
        onRowClick={handleOpenProDrawer}
      />

      <ActionModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedPro?.user.name || 'Freelancer Profile'}
        subtitle={selectedPro?.user.email}
        width="560px"
        isDrawer={true}
        footer={
          selectedPro && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Profile
              </button>
              {isEditing ? (
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleSaveEdit}>
                  Save Bio
                </button>
              ) : (
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Bio
                </button>
              )}
            </div>
          )
        }
      >
        {selectedPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {actionError && (
              <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
                {actionError}
              </div>
            )}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Bio
              </h4>
              {isEditing ? (
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              ) : (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>
                  {selectedPro.bio || 'No bio provided.'}
                </p>
              )}
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                Account
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Email Contact:</span>
                  <span>{selectedPro.user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Marketplace Member Since:</span>
                  <span>{new Date(selectedPro.user.createdAt).toLocaleDateString()}</span>
                </div>
=======
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
>>>>>>> origin/main
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

<<<<<<< HEAD
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Freelancer Profile"
        message={`Are you sure you want to permanently delete ${selectedPro?.user.name}'s gig professional profile? This cannot be undone.`}
        confirmLabel="Delete Profile"
        isDangerous={true}
=======
      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={`Suspend ${selectedPro?.name}?`}
        message="Suspending this freelancer will prevent them from bidding on new tasks or submitting milestones. All active escrow balances will remain locked until ongoing deliverables are arbitrated."
        confirmLabel="Confirm Suspension"
        isDanger={true}
        onConfirm={handleSuspendConfirm}
        onCancel={() => setIsSuspendDialogOpen(false)}
>>>>>>> origin/main
      />
    </div>
  );
};

export default GigProfessionalManagement;
