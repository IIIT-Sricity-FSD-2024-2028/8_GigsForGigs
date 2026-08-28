<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { ReviewIcon } from '../../../components/super-admin/Icons';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminReview } from '../../../types/super-admin';

/**
 * @file Reviews.tsx
 * @description
 * Review moderation queue backed by real `/api/admin/reviews` data.
 *
 * The real `Review` model has no moderation status (no APPROVED/FLAGGED/
 * HIDDEN column, no flagCount) — reviews just exist or don't. The
 * "approve"/"hide" workflow from the mock has been replaced with what the
 * backend actually supports: deleting a review outright (the closest real
 * equivalent to "hide" — DELETE /admin/reviews/:reviewId).
 */

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [targetReview, setTargetReview] = useState<AdminReview | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listReviews();
        if (!cancelled) setReviews(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load reviews.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteConfirm = async () => {
    if (!targetReview) return;
    setActionError(null);
    try {
      await adminApi.deleteReview(targetReview.reviewId);
      setReviews((prev) => prev.filter((r) => r.reviewId !== targetReview.reviewId));
      setIsDeleteDialogOpen(false);
      setTargetReview(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete review.');
      setIsDeleteDialogOpen(false);
    }
=======
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface ModerationReview {
  id: string;
  taskId: string;
  taskTitle: string;
  reviewerName: string;
  reviewerRole: 'CLIENT' | 'GIG_PROFESSIONAL';
  targetUserName: string;
  rating: number;
  comment: string;
  flagCount: number;
  flagReason?: string;
  status: 'APPROVED' | 'FLAGGED' | 'HIDDEN';
  createdAt: string;
}

export const Reviews: React.FC = () => {
  const toast = useToast();
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'hidden'>('all');

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      const data = await adminApi.getReviews();
      if (isMounted) {
        setReviews(data);
      }
    }
    loadReviews();
    return () => { isMounted = false; };
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'flagged') return r.status === 'FLAGGED' || r.flagCount > 0;
    if (activeTab === 'hidden') return r.status === 'HIDDEN';
    return true;
  });

  const handleModerate = async (id: string, newStatus: ModerationReview['status']) => {
    await adminApi.moderateReview(id, newStatus);
    const updated = reviews.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setReviews(updated);
    toast.info('Review Moderated', `Review status changed to ${newStatus}. Aggregate ratings recalculated.`);
>>>>>>> origin/main
  };

  const columns: ColumnDef<AdminReview>[] = [
    {
      header: 'Task & Parties',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.task.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            From: {row.reviewer.name} → To: {row.reviewee.name}
          </span>
        </div>
      )
    },
    {
      header: 'Rating',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#bf6900' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewIcon key={i} size={14} color={i < row.rating ? '#bf6900' : 'var(--color-border)'} />
          ))}
          <span style={{ marginLeft: '4px', fontWeight: 700, color: 'var(--color-text-dark)' }}>{row.rating}/5</span>
        </div>
      )
    },
    {
      header: 'Feedback Comment',
      cell: (row) => (
<<<<<<< HEAD
        <div style={{ maxWidth: '320px' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
            "{row.comment || '—'}"
          </p>
=======
        <div style={{ maxWidth: '380px' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)' }}>
            "{row.comment}"
          </p>
          {row.flagReason && (
            <span style={{ fontSize: '11px', color: 'var(--color-danger-text)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
              🚩 Flag Reason: {row.flagReason}
            </span>
          )}
>>>>>>> origin/main
        </div>
      )
    },
    {
<<<<<<< HEAD
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setActionError(null);
            setTargetReview(row);
            setIsDeleteDialogOpen(true);
          }}
        >
          Delete
        </button>
=======
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Moderation Actions',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.status !== 'APPROVED' && (
            <button
              onClick={() => handleModerate(row.id, 'APPROVED')}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Approve
            </button>
          )}
          {row.status !== 'HIDDEN' && (
            <button
              onClick={() => handleModerate(row.id, 'HIDDEN')}
              className="admin-btn admin-btn-danger"
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Hide Review
            </button>
          )}
        </div>
>>>>>>> origin/main
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading reviews…</div>;
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
      {actionError && (
        <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
          {actionError}
        </div>
      )}

      <DataTable
        title="Marketplace Feedback Moderation"
        columns={columns}
        data={reviews}
        pageSize={6}
        searchPlaceholder="Search reviews by party or comment..."
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message={`Are you sure you want to permanently delete this review by ${targetReview?.reviewer.name}? This cannot be undone.`}
        confirmLabel="Delete Review"
        isDangerous={true}
      />
=======
      <AdminTabs
        tabs={[
          { id: 'all', label: 'All Reviews', count: reviews.length },
          { id: 'flagged', label: 'Flagged Queue', count: reviews.filter((r) => r.status === 'FLAGGED' || r.flagCount > 0).length },
          { id: 'hidden', label: 'Hidden / Suppressed', count: reviews.filter((r) => r.status === 'HIDDEN').length }
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={filteredReviews}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search reviews by task, party, or feedback..."
        />
      </div>
>>>>>>> origin/main
    </div>
  );
};

export default Reviews;
