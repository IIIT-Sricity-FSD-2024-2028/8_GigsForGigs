import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { ReviewIcon } from '../../../components/super-admin/Icons';
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
        <div style={{ maxWidth: '320px' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
            "{row.comment || '—'}"
          </p>
        </div>
      )
    },
    {
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
    </div>
  );
};

export default Reviews;
