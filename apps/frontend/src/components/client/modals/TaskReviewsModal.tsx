import React from 'react';
import { Modal } from '../../common/Modal';
import type { Contract, ContractReview } from '../../../context/ClientContext/ClientContext';

export interface TaskReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  currentUserId?: number;
  onOpenRateReview?: () => void;
}

export const TaskReviewsModal: React.FC<TaskReviewsModalProps> = ({
  isOpen,
  onClose,
  contract,
  currentUserId,
  onOpenRateReview,
}) => {
  if (!contract) return null;

  const reviews: ContractReview[] = contract.reviews || [];

  // Reliable direction identification:
  // Client's review is where reviewerId matches the current authenticated Client userId,
  // or fallback to reviewerName not matching gig_pro_name.
  const clientReview = reviews.find((r) =>
    currentUserId ? r.reviewerId === currentUserId : r.revieweeName === contract.gig_pro_name
  );

  // Gig professional's review is where reviewerId differs from Client userId (or reviewerName matches gig_pro_name).
  const gigReview = reviews.find((r) =>
    currentUserId
      ? r.reviewerId !== currentUserId && (r.revieweeId === currentUserId || r.reviewerName === contract.gig_pro_name)
      : r.reviewerName === contract.gig_pro_name
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Contract Two-Sided Reviews"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Task Engagement
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D568D', margin: '2px 0 0 0' }}>
            {contract.task_title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Gig Professional: <strong>{contract.gig_pro_name}</strong>
          </p>
        </div>

        {/* 1. Review written by Client for Gig Pro */}
        <div style={{ backgroundColor: '#F0F6F6', borderRadius: '12px', padding: '16px', border: '1px solid #D5DDE0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D568D' }}>
                Your Review of {contract.gig_pro_name}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#E8F0FE', color: '#1A73E8', fontWeight: 700 }}>
                Client Feedback
              </span>
            </div>
            {clientReview && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#D47700' }}>
                {'★'.repeat(clientReview.rating)}{'☆'.repeat(5 - clientReview.rating)} ({clientReview.rating}.0)
              </span>
            )}
          </div>

          {clientReview ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '6px 0', lineHeight: 1.5 }}>
                "{clientReview.comment || 'No written comment provided.'}"
              </p>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Submitted on {formatDate(clientReview.createdAt)}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                You have not submitted a review for this professional yet.
              </span>
              {contract.status === 'COMPLETED' && onOpenRateReview && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRateReview();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#D47700',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ★ Rate &amp; Review Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Review written by Gig Pro for Client */}
        <div style={{ backgroundColor: '#FAF6F0', borderRadius: '12px', padding: '16px', border: '1px solid #EADBCC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#8A5000' }}>
                {contract.gig_pro_name}'s Review of You
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#FEF7E0', color: '#B06000', fontWeight: 700 }}>
                Professional Feedback
              </span>
            </div>
            {gigReview && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#D47700' }}>
                {'★'.repeat(gigReview.rating)}{'☆'.repeat(5 - gigReview.rating)} ({gigReview.rating}.0)
              </span>
            )}
          </div>

          {gigReview ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '6px 0', lineHeight: 1.5 }}>
                "{gigReview.comment || 'No written comment provided.'}"
              </p>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Submitted on {formatDate(gigReview.createdAt)}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
              The gig professional has not submitted a review for this contract yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-text-dark)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskReviewsModal;
