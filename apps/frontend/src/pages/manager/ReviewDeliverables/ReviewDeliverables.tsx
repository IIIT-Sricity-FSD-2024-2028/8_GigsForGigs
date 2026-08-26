import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

interface ReviewDeliverablesProps {
  onBack: () => void;
}

export const ReviewDeliverables: React.FC<ReviewDeliverablesProps> = ({ onBack }) => {
  const { selectedTask, deliverables, addDeliverable, reviewDeliverable, closeDeliverable, loading } = useManager();

  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [submissionPath, setSubmissionPath] = useState('');
  const [gigProfileId, _setGigProfileId] = useState<number>(201);
  const [reviewingNo, setReviewingNo] = useState<number | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'revision_requested'>('approved');
  const [feedback, setFeedback] = useState('');

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

  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !submissionPath) return;
    const success = await addDeliverable(selectedTask.taskId, {
      gigProfileId: assignedPro?.gigProfileId || gigProfileId,
      description,
      submissionPath
    });
    if (success) {
      setDescription('');
      setSubmissionPath('');
      setShowAddForm(false);
    }
  };

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
              {assignedPro?.user?.name || 'Arham Kansal'}
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

      {/* Deliverables Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
            Atomic Deliverables ({deliverables.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#76594F', margin: '4px 0 0 0' }}>
            Set, review, and close operational deliverables for this task.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: '#D47700',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Cancel Add' : '+ Create Deliverable'}
        </button>
      </div>

      {/* Form: Create Deliverable */}
      {showAddForm && (
        <form
          onSubmit={handleCreateDeliverable}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #D9E0E3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h3 style={{ fontSize: '16px', color: '#0D568D', margin: 0 }}>Create New Deliverable</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
              Deliverable Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement authentication JWT middleware"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #D5DDE0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
              Submission Path / PR URL *
            </label>
            <input
              type="text"
              required
              placeholder="https://github.com/org/repo/pull/1"
              value={submissionPath}
              onChange={e => setSubmissionPath(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #D5DDE0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D8D8', color: '#3A1F16', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#0D568D', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Submitting...' : 'Save Deliverable'}
            </button>
          </div>
        </form>
      )}

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #D9E0E3' }}>
          <p style={{ color: '#76594F', margin: 0 }}>No deliverables set for this task yet.</p>
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

                <div style={{ fontSize: '13px', color: '#76594F', marginTop: '4px' }}>
                  Submission Path:{' '}
                  <a href={del.submissionPath} target="_blank" rel="noreferrer" style={{ color: '#0D568D', fontWeight: 600 }}>
                    {del.submissionPath}
                  </a>
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
                    <input
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
                    <button
                      onClick={() => closeDeliverable(selectedTask.taskId, del.deliverableNo)}
                      disabled={del.status === 'closed'}
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
