import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
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
    setSelectedPro(pro);
    setEditBio(pro.bio ?? '');
    setIsEditing(false);
    setActionError(null);
    setIsDrawerOpen(true);
  };

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
    { header: 'Email', cell: (row) => row.user.email },
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
              </div>
            </div>
          </div>
        )}
      </ActionModal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Freelancer Profile"
        message={`Are you sure you want to permanently delete ${selectedPro?.user.name}'s gig professional profile? This cannot be undone.`}
        confirmLabel="Delete Profile"
        isDangerous={true}
      />
    </div>
  );
};

export default GigProfessionalManagement;
