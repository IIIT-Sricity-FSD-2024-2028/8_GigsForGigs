import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ReviewIcon } from '../../../components/super-admin/Icons';
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
  };

  const columns: ColumnDef<ModerationReview>[] = [
    {
      header: 'Task & Parties',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.taskTitle}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            From: {row.reviewerName} ({row.reviewerRole}) $\rightarrow$ To: {row.targetUserName}
          </span>
        </div>
      )
    },
    {
      header: 'Rating',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#bf6900' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewIcon
              key={i}
              size={14}
              color={i < row.rating ? '#bf6900' : 'var(--color-border)'}
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
            "{row.comment}"
          </p>
          {row.flagReason && (
            <span style={{ fontSize: '11px', color: 'var(--color-danger-text)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
              🚩 Flag Reason: {row.flagReason}
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
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
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
    </div>
  );
};

export default Reviews;
