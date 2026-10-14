import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/common/Table';

export interface ReviewShortlistProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export const ReviewShortlist: React.FC<ReviewShortlistProps> = ({ onNavigate, params }) => {
  const { applications, hireCandidate, rejectCandidate } = useClient();
  const taskId = params?.taskId;

  // Undecided marketplace applicants; manager-shortlisted ones first.
  const currentApplications = applications
    .filter(a => (a.status === 'PENDING' || a.status === 'SHORTLISTED') && !a.is_service_request)
    .filter(a => !taskId || a.task_id === taskId)
    .sort((a, b) => Number(b.status === 'SHORTLISTED') - Number(a.status === 'SHORTLISTED'));

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const handleApprove = async (appId: string) => {
    try {
      await hireCandidate(appId);
      alert('Candidate approved and contract created successfully!');
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

  return (
    <div>
      <PageHeader title="Pending Hire Approvals" description="Review applicants and candidates shortlisted by your manager before hiring." />

      <div className="activity-section">
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="activity-title">Candidates</h2>
          {taskId && (
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
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No pending hire approvals found.
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
                      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a.hourlyRate)
                      : '—'}
                  </td>
                  <td className="budget-cell">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a.rate)}
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
