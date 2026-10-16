import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/common/Table';

export interface ReviewShortlistProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export const ReviewShortlist: React.FC<ReviewShortlistProps> = ({ onNavigate, params }) => {
  const { applications, tasks, hireCandidate, rejectCandidate } = useClient();
  const taskId = params?.taskId;

  const filterTask = taskId ? tasks.find(t => String(t.task_id) === String(taskId)) : null;

  // Undecided marketplace applicants; manager-shortlisted ones first.
  const currentApplications = applications
    .filter(a => (a.status === 'PENDING' || a.status === 'SHORTLISTED') && !a.is_service_request)
    .filter(a => !taskId || String(a.task_id) === String(taskId))
    .sort((a, b) => Number(b.status === 'SHORTLISTED') - Number(a.status === 'SHORTLISTED'));

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const handleApprove = async (appId: string) => {
    try {
      await hireCandidate(appId);
      alert('Candidate hired! Pay the escrow amount (task budget + 10% platform fee) so they can start work.');
      onNavigate('my-gigs');
    } catch (err) {
      console.error('Approve hire failed:', err);
      alert(errorMessage(err, 'Failed to approve this candidate. Please try again.'));
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await rejectCandidate(appId);
      alert('Candidate application discarded.');
    } catch (err) {
      console.error('Reject hire failed:', err);
      alert(errorMessage(err, 'Failed to reject this candidate. Please try again.'));
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div>
      <PageHeader
        title="Pending Requests / Hire Approvals"
        description="Review applicants and candidates shortlisted by your manager before hiring."
      />

      {filterTask && (
        <div
          style={{
            backgroundColor: '#F0F6F9',
            border: '1px solid #D1E3E9',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: 'var(--spacing-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#084B83' }}>
              Filtered by Task:
            </span>
            <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontSize: '1rem' }}>
              {filterTask.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Budget: {formatCurrency(filterTask.budget)} • Category: {filterTask.category || 'General'}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#FFFFFF' }}
            onClick={() => onNavigate('review-shortlist', {})}
          >
            Show All Pending Tasks
          </button>
        </div>
      )}

      <div className="activity-section">
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="activity-title">
            Candidates {currentApplications.length > 0 ? `(${currentApplications.length})` : ''}
          </h2>
          {taskId && !filterTask && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.875rem', padding: '6px 12px', background: 'transparent', cursor: 'pointer' }}
              onClick={() => onNavigate('review-shortlist', {})}
            >
              Show all tasks
            </button>
          )}
        </div>

        <Table className="activity-table" id="shortlist-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Project</th>
              <th>Rating</th>
              <th>Hourly Rate</th>
              <th>Task Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentApplications.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--color-text-muted)' }}>
                  {filterTask ? (
                    <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '2rem' }}>👥</div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>
                        No candidates for &quot;{filterTask.title}&quot; yet
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        No gig professionals have applied or been shortlisted for this task yet. It is currently open and visible on the marketplace.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                          onClick={() => onNavigate('search-talent')}
                        >
                          Browse Talent &amp; Hire
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                          onClick={() => onNavigate('review-shortlist', {})}
                        >
                          Show All Tasks
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '2rem' }}>📋</div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-dark)' }}>
                        No pending hire approvals
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        You have no candidates or shortlisted applicants awaiting hire approval right now.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '6px 14px', marginTop: '8px' }}
                        onClick={() => onNavigate('search-talent')}
                      >
                        Search Talent
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              currentApplications.map(a => (
                <tr key={a.application_id}>
                  <td>
                    <div className="pro-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="pro-photo" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-blue)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {a.candidate_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <div className="task-name-cell">{a.candidate_name}</div>
                        <div className="task-category">{a.status === 'SHORTLISTED' ? 'Shortlisted by manager · ' : ''}{a.candidate_role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{a.task_title}</td>
                  <td>{a.rating ? `${a.rating} / 5` : '—'}</td>
                  <td>
                    {a.hourlyRate
                      ? formatCurrency(a.hourlyRate)
                      : '—'}
                  </td>
                  <td className="budget-cell">
                    {formatCurrency(a.rate)}
                  </td>
                  <td>
                    <div className="actions-cell" style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-hire"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleApprove(a.application_id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-changes"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'transparent' }}
                        onClick={() => handleReject(a.application_id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ReviewShortlist;
