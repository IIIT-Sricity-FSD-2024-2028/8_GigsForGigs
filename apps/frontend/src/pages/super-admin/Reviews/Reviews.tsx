import React, { useEffect, useState } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ReviewIcon, ArrowRightIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchReviews,
  moderateReview
} from '../../../store/admin/adminSlice';
import {
  selectReviews,
  selectReviewsRequest
} from '../../../store/admin/selectors';
import type { ModerationReview } from '../../../store/admin/types';
import { extractErrorMessage } from '../../../utils/adminAccess';

export type { ModerationReview };

export const Reviews: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const reviews = useAppSelector(selectReviews);
  const reviewsRequest = useAppSelector(selectReviewsRequest);

  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'hidden'>('all');

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  const handleModerate = async (id: string, newStatus: ModerationReview['status']) => {
    try {
      await dispatch(moderateReview({ reviewId: id, status: newStatus })).unwrap();
      toast.info('Review Moderated', `Review is now ${newStatus}. Hidden reviews don't count toward ratings.`);
    } catch (err: unknown) {
      toast.error('Moderation Failed', extractErrorMessage(err, 'Failed to update review status.'));
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'flagged') return r.status === 'FLAGGED';
    if (activeTab === 'hidden') return r.status === 'HIDDEN';
    return true;
  });

  const columns: ColumnDef<ModerationReview>[] = [
    {
      header: 'Task & Parties',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span>From: {row.reviewerName} ({row.reviewerRole})</span>
              <ArrowRightIcon size={11} color="var(--color-text-muted)" />
              <span>To: {row.targetUserName}</span>
            </span>
          </span>
        </div>
      )
    },
    {
      header: 'Rating',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#9A5100' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewIcon
              key={i}
              size={14}
              color={i < row.rating ? '#9A5100' : 'var(--color-border)'}
            />
          ))}
          <span style={{ marginLeft: '4px', fontWeight: 700, color: 'var(--color-text-dark)' }}>
            {row.rating}/5
          </span>
        </div>
      )
    },
    {
      header: 'Feedback Comment',
      cell: (row) => (
        <div style={{ maxWidth: '380px' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)' }}>
            {row.comment ? `"${row.comment}"` : 'No comment left'}
          </p>
          {row.moderatorNotes && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
              Moderator: {row.moderatorNotes}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Moderation Actions',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.status !== 'PUBLISHED' && (
            <button
              onClick={() => handleModerate(row.id, 'PUBLISHED')}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              Publish
            </button>
          )}
          {row.status !== 'HIDDEN' && (
            <button
              onClick={() => handleModerate(row.id, 'HIDDEN')}
              className="admin-btn admin-btn-danger"
              style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              Hide Review
            </button>
          )}
        </div>
      )
    }
  ];

  if (reviewsRequest.status === 'loading' && reviews.length === 0) {
    return <Loader label="Loading reviews..." />;
  }

  if (reviewsRequest.error && reviews.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {reviewsRequest.error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <AdminTabs
        tabs={[
          { id: 'all', label: 'All Reviews', count: reviews.length },
          { id: 'flagged', label: 'Flagged Queue', count: reviews.filter((r) => r.status === 'FLAGGED').length },
          { id: 'hidden', label: 'Hidden / Suppressed', count: reviews.filter((r) => r.status === 'HIDDEN').length }
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'all' | 'flagged' | 'hidden')}
      />

      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <DataTable
          data={filteredReviews}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Search reviews by task, party, or feedback..."
        />
      </div>
    </div>
  );
};

export default Reviews;
