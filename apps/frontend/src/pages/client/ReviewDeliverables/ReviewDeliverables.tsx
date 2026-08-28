import React, { useEffect } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface ReviewDeliverablesProps {
  onNavigate: (viewId: string) => void;
  params?: Record<string, string>;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onNavigate, params }) => {
  const { deliverables, approveDeliverable, rejectDeliverable, contracts, fetchTaskDeliverables } = useClient();
  const taskId = params?.taskId;

  useEffect(() => {
    if (taskId) {
      fetchTaskDeliverables(taskId).catch((err) => console.error('Failed to load deliverables:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const taskDeliverables = taskId ? deliverables.filter(d => d.task_id === taskId) : [];
  // Prefer the most recently submitted deliverable awaiting review.
  const currentDeliverable = taskDeliverables.find(d => d.status === 'PENDING')
    ?? taskDeliverables[taskDeliverables.length - 1]
    ?? null;

  const currentContract = contracts.find(c => c.task_id === taskId) ?? {
    gig_pro_name: 'Unassigned',
    task_title: 'Task',
    budget: 0,
  };

  const handleApprove = async () => {
    if (!taskId || !currentDeliverable) return;
    try {
      await approveDeliverable(taskId, currentDeliverable.deliverable_no);
      alert('Deliverable approved and escrow funds released!');
      onNavigate('dashboard');
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Failed to approve the deliverable. Please try again.');
    }
  };

  const handleRequestChanges = async () => {
    if (!taskId || !currentDeliverable) return;
    try {
      await rejectDeliverable(taskId, currentDeliverable.deliverable_no);
      alert('Changes requested. The freelancer has been notified.');
      onNavigate('dashboard');
    } catch (err) {
      console.error('Revision request failed:', err);
      alert('Failed to request changes. Please try again.');
    }
  };

  if (!taskId || !currentDeliverable) {
    return (
      <div>
        <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="page-title">Review Deliverables</h1>
          <p className="page-subtitle">No deliverable has been submitted for this task yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <a
          href="#my-gigs"
          onClick={(e) => { e.preventDefault(); onNavigate('my-gigs'); }}
          className="back-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--color-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Active Contracts
        </a>
        <h1 className="page-title">Review Deliverables</h1>
        <p className="page-subtitle">
          Please review the submitted work for <strong>{currentContract.task_title}</strong>.
        </p>
      </div>

      <div className="review-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-lg)' }}>
        
        {/* Left Column: File Preview */}
        <div>
          <div className="deliverable-preview" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#e4ebeb' }}>
            <div className="preview-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="preview-filename" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Final_Brand_Guidelines.pdf
              </div>
              <div className="preview-actions" style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => alert('Zoom triggered.')}>Zoom</button>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => alert('Download triggered.')}>Download</button>
              </div>
            </div>

            <div className="preview-canvas" style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
              <div className="mock-pdf">
                <div className="mock-pdf-hero"></div>
                <div className="mock-pdf-line-thick"></div>
                <div className="mock-pdf-line"></div>
                <div className="mock-pdf-line mock-pdf-line-90"></div>
                <div className="mock-pdf-line"></div>
                <div className="mock-pdf-footer">
                  <div className="mock-pdf-dot"></div>
                  <div className="mock-pdf-footer-lines">
                    <div className="mock-pdf-footer-line"></div>
                    <div className="mock-pdf-footer-line mock-pdf-footer-line-short"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="file-tabs" style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
            <div className="file-tab active" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: 'var(--color-white)' }}>
              Final_Brand_Guidelines.pdf
            </div>
            <div className="file-tab" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: 'transparent' }} onClick={() => alert('Switch tab.')}>
              Logo_Pack.zip
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Actions */}
        <div>
          <div className="deliverable-sidebar" style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)' }}>

            <div className="deliverable-submitter" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <div className="deliverable-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-blue)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {currentContract.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
              <div>
                <div className="deliverable-submitter-name" style={{ fontWeight: 600 }}>{currentContract.gig_pro_name}</div>
                <div className="deliverable-submitter-date" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Submitted on {currentDeliverable.createdAt}
                </div>
              </div>
            </div>

            <div className="deliverable-message-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Message from Professional
            </div>
            <div className="deliverable-message-text" style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)', border: '1px solid var(--color-border)' }}>
              "{currentDeliverable.content}"
            </div>

            <div className="escrow-section" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              <div className="escrow-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                <span className="escrow-label" style={{ fontWeight: 500 }}>Payment Held in Escrow</span>
                <span className="escrow-amount" style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-text-dark)' }}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(currentContract.budget)}
                </span>
              </div>
              <p className="escrow-note" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                Approving will release the funds to the professional and close this task.
              </p>

              <div className="deliverable-action-btns" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentDeliverable.status === 'PENDING' ? (
                  <>
                    <button
                      className="btn-approve"
                      style={{ padding: '12px', fontSize: '0.9rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-white)', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                      onClick={handleApprove}
                    >
                      Approve &amp; Release Payment
                    </button>
                    <button
                      className="btn-changes"
                      style={{ padding: '12px', fontSize: '0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent', color: 'var(--color-text-dark)', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                      onClick={handleRequestChanges}
                    >
                      Request Changes / Revision
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-secondary)', padding: '12px' }}>
                    Status: {currentDeliverable.status}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default ReviewDeliverables;
