import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';

export interface GigReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
  clientName: string;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: '★★★★★ - Excellent (5 Stars) - Clear requirements and seamless collaboration',
  4: '★★★★☆ - Very Good (4 Stars) - Good communication and timely milestone feedback',
  3: '★★★☆☆ - Satisfactory (3 Stars) - Acceptable collaboration with minor delays',
  2: '★★☆☆☆ - Needs Improvement (2 Stars) - Unclear requirements or delayed feedback',
  1: '★☆☆☆☆ - Unsatisfactory (1 Star) - Difficult collaboration or severe issues',
};

export const GigReviewModal: React.FC<GigReviewModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  clientName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRating = hoverRating ?? rating;

  const handleClose = () => {
    if (submitting) return;
    setErrorMessage(null);
    setComment('');
    setRating(5);
    setHoverRating(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating between 1 and 5 stars.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await gigApi.createReview(taskId, rating, comment.trim() || undefined);
      onSuccess?.();
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorMessage(err.message || 'You have already reviewed this client for this task.');
        } else {
          setErrorMessage(err.message || 'Failed to submit review.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while submitting your review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={`Review Client: ${clientName}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Completed Project
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-dark)', margin: '2px 0 0 0' }}>
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

        {/* Interactive 1-5 Star Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '8px' }}>
            Client Collaboration &amp; Clarity Rating *
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
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)', marginLeft: '6px' }}>
              {activeRating}.0 / 5.0
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {RATING_DESCRIPTIONS[activeRating] || `${activeRating} Stars`}
          </div>
        </div>

        {/* Comment Field */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              Feedback for Client (Optional)
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
            placeholder="Share feedback on requirement clarity, responsiveness, and prompt milestone acceptance..."
            disabled={submitting}
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
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={handleClose}
            disabled={submitting}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={submitting}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {submitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GigReviewModal;
