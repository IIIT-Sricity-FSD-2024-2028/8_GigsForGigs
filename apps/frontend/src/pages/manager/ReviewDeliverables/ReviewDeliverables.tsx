import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { safeHttpUrl } from '../../../utils/helpers/safeUrl';
import { TaskDeliverablesManager } from '../../../components/client/sections/TaskDeliverablesManager';
import { managerApi } from '../../../services/api/manager/managerApi';

interface ReviewDeliverablesProps {
  onBack: () => void;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onBack }) => {
  const { selectedTask, deliverables, applications, shortlistApplication, reviewDeliverable, closeDeliverable, loading, error } = useManager();

  const [reviewingNo, setReviewingNo] = useState<number | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'revision_requested'>('approved');
  const [feedback, setFeedback] = useState('');
  const [ratings, setRatings] = useState<Record<number, number>>({});

  if (!selectedTask) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
        <p style={{ color: '#76594F' }}>No task selected.</p>
        <button onClick={onBack} style={{ backgroundColor: '#0D568D', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '12px' }}>
          Back to Assigned Tasks
        </button>
      </div>
    );
  }

  const assignedPro = selectedTask.assignments?.[0]?.gigProfile;
  const openApplications = applications.filter(a => a.status === 'pending' || a.status === 'shortlisted');

  const handleReviewSubmit = async (deliverableNo: number) => {
    const success = await reviewDeliverable(selectedTask.taskId, deliverableNo, {
      status: reviewStatus,
      feedback
    });
    if (success) {
      setReviewingNo(null);
      setFeedback('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Navigation */}
      <div>
        <button
          onClick={onBack}
          style={{ backgroundColor: 'transparent', border: 'none', color: '#0D568D', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
        >
          ← Back to Assigned Tasks
        </button>
      </div>

      {/* Task Summary Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #D9E0E3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#76594F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned Task #{selectedTask.taskId}
            </span>
            <h1 style={{ fontSize: '24px', color: '#0D568D', margin: '4px 0 8px 0', fontWeight: 700 }}>
              {selectedTask.title}
            </h1>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '12px',
              backgroundColor: selectedTask.status === 'in_progress' ? '#E4EEF5' : selectedTask.status === 'completed' ? '#E4F2EF' : '#F8EBD9',
              color: selectedTask.status === 'in_progress' ? '#0D568D' : selectedTask.status === 'completed' ? '#438F82' : '#B86300'
            }}
          >
            {selectedTask.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <p style={{ color: '#3A1F16', fontSize: '15px', lineHeight: 1.6, marginTop: '12px' }}>
          {selectedTask.description || 'No detailed description.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F0F4F6' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#76594F' }}>Client Name</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#3A1F16', marginTop: '2px' }}>
              {selectedTask.client?.clientName || 'TechCorp Solutions'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#76594F' }}>Assigned Gig Professional</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#3A1F16', marginTop: '2px' }}>
              {assignedPro?.user?.name || 'Not hired yet'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#76594F' }}>Task Budget</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#3A1F16', marginTop: '2px' }}>
              ₹{typeof selectedTask.budget === 'number' ? selectedTask.budget.toLocaleString() : selectedTask.budget}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#76594F', marginBottom: '6px' }}>
            <span>Overall Deliverables Progress</span>
            <span>{selectedTask.progress || 50}% Completed</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#D9E0E3', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${selectedTask.progress || 50}%`,
                backgroundColor: selectedTask.status === 'completed' ? '#55A99A' : '#0D568D',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ backgroundColor: '#FDE8E8', color: '#9B1C1C', padding: '12px 16px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Applicants: managers shortlist, the client makes the hire */}
      {selectedTask.status === 'open' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #D9E0E3' }}>
          <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>Applicants ({openApplications.length})</h2>
          <p style={{ fontSize: '13px', color: '#76594F', margin: '4px 0 16px 0' }}>
            Shortlist strong candidates; the client approves the final hire.
          </p>
          {openApplications.length === 0 ? (
            <p style={{ color: '#76594F', margin: 0 }}>No open applications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {openApplications.map(app => (
                <div key={app.applicationId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', border: '1px solid #E4EEF5', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#3A1F16' }}>{app.gigProfile?.user.name ?? `Professional #${app.gigProfileId}`}</div>
                    <div style={{ fontSize: '12px', color: '#76594F' }}>
                      Applied {new Date(app.createdAt).toLocaleDateString('en-IN')}
                      {app.rating ? ` · Rated ${app.rating}/5` : ''}
                    </div>
                  </div>
                  {app.status === 'shortlisted' ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#438F82' }}>SHORTLISTED</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        aria-label="Rating"
                        value={ratings[app.applicationId] ?? ''}
                        onChange={e => setRatings(prev => ({ ...prev, [app.applicationId]: Number(e.target.value) }))}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D5DDE0', fontSize: '12px' }}
                      >
                        <option value="">Rating (optional)</option>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} / 5</option>)}
                      </select>
                      <button
                        disabled={loading}
                        onClick={() => shortlistApplication(selectedTask.taskId, app.applicationId, ratings[app.applicationId] ? { rating: ratings[app.applicationId] } : {})}
                        style={{ backgroundColor: '#0D568D', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Shortlist
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scope items the professional delivers against — same editor the client uses. */}
      {selectedTask.status !== 'open' && (
        <TaskDeliverablesManager key={selectedTask.taskId} taskId={selectedTask.taskId} readOnly={selectedTask.status !== 'in_progress'} api={managerApi} />
      )}

      {/* Deliverables Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
            Atomic Deliverables ({deliverables.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#76594F', margin: '4px 0 0 0' }}>
            Review work the professional submits. Approving work never completes the task — the client does that when releasing payment.
          </p>
        </div>
      </div>

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #D9E0E3' }}>
          <p style={{ color: '#76594F', margin: 0 }}>No work has been submitted for this task yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deliverables.map(del => (
            <div
              key={del.deliverableNo}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #D9E0E3',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D568D', backgroundColor: '#E4EEF5', padding: '4px 10px', borderRadius: '6px' }}>
                    Deliverable #{del.deliverableNo}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '10px',
                      backgroundColor: del.status === 'approved' || del.status === 'closed' ? '#E4F2EF' : del.status === 'submitted' ? '#F8EBD9' : '#F8E8E8',
                      color: del.status === 'approved' || del.status === 'closed' ? '#438F82' : del.status === 'submitted' ? '#B86300' : '#C94C4C'
                    }}
                  >
                    {del.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 600, color: '#3A1F16', marginTop: '8px' }}>
                  {del.description}
                </div>

                {del.claimedDefinitions && del.claimedDefinitions.length > 0 && <div className="submission-definition__claims">
                  <strong>Client-defined deliverables:</strong>
                  <ul>{del.claimedDefinitions.map(item => <li key={item.definitionId}>{item.title}</li>)}</ul>
                </div>}

                <div style={{ fontSize: '13px', color: '#76594F', marginTop: '4px' }}>
                  Submission Path:{' '}
                  {safeHttpUrl(del.submissionPath) ? (
                    <a href={safeHttpUrl(del.submissionPath)} target="_blank" rel="noopener noreferrer" style={{ color: '#0D568D', fontWeight: 600 }}>
                      {del.submissionPath}
                    </a>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{del.submissionPath}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {reviewingNo === del.deliverableNo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
                    <select
                      value={reviewStatus}
                      onChange={e => setReviewStatus(e.target.value as any)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D5DDE0', fontSize: '12px' }}
                    >
                      <option value="approved">Approve</option>
                      <option value="revision_requested">Request Revision</option>
                    </select>
                    <input maxLength={500}
                      type="text"
                      placeholder="Optional feedback..."
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D5DDE0', fontSize: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleReviewSubmit(del.deliverableNo)}
                        style={{ backgroundColor: '#0D568D', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', flex: 1 }}
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setReviewingNo(null)}
                        style={{ backgroundColor: '#FFF', border: '1px solid #CCC', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {del.status === 'submitted' && selectedTask.status === 'in_progress' && (
                    <button
                      onClick={() => setReviewingNo(del.deliverableNo)}
                      style={{
                        backgroundColor: '#0D568D',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Review
                    </button>
                    )}
                    {(del.status === 'approved' || del.status === 'closed') && (
                    <button
                      onClick={() => closeDeliverable(selectedTask.taskId, del.deliverableNo)}
                      disabled={del.status === 'closed' || selectedTask.status !== 'in_progress'}
                      style={{
                        backgroundColor: del.status === 'closed' ? '#D9E0E3' : '#55A99A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: del.status === 'closed' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {del.status === 'closed' ? 'Closed' : 'Close'}
                    </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewDeliverables;
