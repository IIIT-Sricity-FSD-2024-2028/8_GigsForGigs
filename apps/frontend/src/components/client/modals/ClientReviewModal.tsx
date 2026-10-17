import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { useClient } from '../../../context/ClientContext';
import { ApiError } from '../../../services/api/httpClient';

export interface ClientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
  gigProName: string;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: '★★★★★ - Excellent (5 Stars) - Exceptional quality and communication',
  4: '★★★★☆ - Very Good (4 Stars) - High quality work delivered well',
  3: '★★★☆☆ - Satisfactory (3 Stars) - Met core task requirements',
  2: '★★☆☆☆ - Needs Improvement (2 Stars) - Several issues encountered',
  1: '★☆☆☆☆ - Unsatisfactory (1 Star) - Did not satisfy requirements',
};

export const ClientReviewModal: React.FC<ClientReviewModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  gigProName,
  onSuccess,
}) => {
  const { submitReview, refreshContracts } = useClient();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await submitReview(taskId, rating, comment);
      await refreshContracts();
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={submitting ? undefined : onClose}
      title={`Rate & Review ${gigProName}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Completed Task
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0D568D', margin: '2px 0 0 0' }}>
            {taskTitle}
          </h3>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: '#FDE8E8',
              color: '#9B1C1C',
              border: '1px solid #F8B4B4',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Interactive Star Rating */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '8px' }}>
            Quality &amp; Delivery Rating *
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '28px',
                  color: star <= activeRating ? '#B45F00' : '#D1D5DB',
                  padding: '2px',
                  lineHeight: 1,
                  transition: 'transform 0.1s ease, color 0.1s ease',
                  transform: star <= activeRating ? 'scale(1.1)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(star)}
                disabled={submitting}
              >
                ★
              </button>
            ))}
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0D568D', marginLeft: '6px' }}>
              {activeRating}.0 / 5.0
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {RATING_DESCRIPTIONS[activeRating] || `${activeRating} Stars`}
          </div>
        </div>

        {/* Review Comment */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              Feedback &amp; Recommendations
            </label>
            <span style={{ fontSize: '11px', color: comment.length > 900 ? '#c5221f' : 'var(--color-text-muted)' }}>
              {comment.length}/1000
            </span>
          </div>
          <textarea
            maxLength={1000}
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share feedback on technical proficiency, requirement clarity, communication, and milestone timeliness..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--color-text-dark)',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            disabled={submitting}
          />
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-text-dark)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0D568D',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientReviewModal;
