import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ReviewIcon } from '../../../components/super-admin/Icons';
import { mockReviews, type ModerationReview } from '../../../mock/adminMockData';

/**
 * @file Reviews.tsx
 * @description
 * Feedback moderation queue and rating integrity supervisor.
 * Allows Super Admins to hide abusive/retaliatory reviews and trigger rating recalculations.
 */

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<ModerationReview[]>(mockReviews);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'hidden'>('all');

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'flagged') return r.status === 'FLAGGED' || r.flagCount > 0;
    if (activeTab === 'hidden') return r.status === 'HIDDEN';
    return true;
  });

  const handleModerate = (id: string, newStatus: ModerationReview['status']) => {
    const updated = reviews.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setReviews(updated);
    alert(`Review marked as ${newStatus}. Aggregate ratings queued for background recalculation.`);
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
        <div style={{ maxWidth: '320px' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
            "{row.comment}"
          </p>
          {row.flagReason && (
            <span style={{ fontSize: '11px', color: 'var(--color-danger-text)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
              Flagged: {row.flagReason}
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
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          {row.status !== 'APPROVED' && (
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => handleModerate(row.id, 'APPROVED')}
            >
              Approve
            </button>
          )}
          {row.status !== 'HIDDEN' && (
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={() => handleModerate(row.id, 'HIDDEN')}
            >
              Hide
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
          { id: 'flagged', label: 'Flagged Queue', count: reviews.filter((r) => r.status === 'FLAGGED').length },
          { id: 'hidden', label: 'Hidden Reviews', count: reviews.filter((r) => r.status === 'HIDDEN').length }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      <DataTable
        title="Marketplace Feedback Moderation"
        columns={columns}
        data={filteredReviews}
        pageSize={6}
        searchPlaceholder="Search reviews by party or comment..."
      />
    </div>
  );
};

export default Reviews;
