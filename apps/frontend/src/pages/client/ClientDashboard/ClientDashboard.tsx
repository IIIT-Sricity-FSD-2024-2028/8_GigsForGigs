import React, { useState } from 'react';
import { useClient, type Task } from '../../../context/ClientContext';
import { useAuth } from '../../../context/AuthContext';
import { DashboardWelcome } from '../../../components/common/dashboard/DashboardWelcome';

export interface ClientDashboardProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { tasks, contracts, applications, loading, error } = useClient();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Metrics
  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const openTasks = tasks.filter(t => t.status === 'OPEN');
  const nonOpenTasks = tasks.filter(t => t.status !== 'OPEN');

  const activeCount = activeTasks.length;                                                 
  const pendingCount = openTasks.length;

  // Total spent = what the client paid (gig amount + platform fee) on released contracts.
  const totalSpent = contracts.filter(c => c.payment_status === 'completed').reduce((sum, c) => sum + c.total_amount, 0);
  const totalSpentFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalSpent);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'REVIEWING': return 'status-review-needed';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-scheduled';
    }
  };

  return (
    <div>
      {error && (
        <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fde8e8', color: '#c94c4c', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      {loading && tasks.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading your workspace…</p>
      )}

      {/* Welcome hero banner */}
      <DashboardWelcome
        titleId="client-greeting"
        title={`Welcome back, ${user?.name || 'there'}!`}
        description="Here's a summary of your workspace activities for today."
        className="client-dashboard-welcome"
      />

      {/* Metric cards row */}
      <div className="metrics-row">
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('my-gigs')}>
          <div className="metric-card-head">
            <div className="metric-icon metric-icon-seagrass">
              <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span className="metric-badge metric-badge-up">+2 this week</span>
          </div>
          <div className="metric-label">Active Task/Contracts</div>
          <div className="metric-value" id="client-active-tasks">{activeCount}</div>
          <div className="metric-description">Approved &amp; in progress</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-head">
            <div className="metric-icon metric-icon-copper">
              <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <span className="metric-badge metric-badge-action">Requires Action</span>
          </div>
          <div className="metric-label">Pending Tasks</div>
          <div className="metric-value" id="client-pending-tasks">
            {String(pendingCount).padStart(2, '0')}
          </div>
          <div className="metric-description">Waiting for your approval</div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('total-spent')}>
          <div className="metric-card-head">
            <div className="metric-icon metric-icon-copper">
              <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span className="metric-badge metric-badge-up">Platform Total</span>
          </div>
          <div className="metric-label">Total Spent</div>
          <div className="metric-value" id="client-total-spent">{totalSpentFormatted}</div>
          <div className="metric-description">Completed contract deliverables</div>
        </div>
      </div>

      {/* Pending Tasks (open — posted but not yet in progress) */}
      <div className="activity-section">
        <div className="activity-header">
          <h2 className="activity-title">
            Pending Tasks{' '}
            <span id="client-posted-count" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '6px' }}>
              ({openTasks.length})
            </span>
          </h2>
          <a
            href="#post-gig"
            onClick={(e) => { e.preventDefault(); onNavigate('post-gig'); }}
            className="activity-link"
          >
            Post New Task &rarr;
          </a>
        </div>

        <table className="activity-table" id="client-posted-tasks-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Posted On</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {openTasks.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xl)' }}>
                  No posted tasks yet.
                </td>
              </tr>
            ) : (
              openTasks.map(t => (
                <tr key={t.task_id}>
                  <td>
                    <div className="task-name-cell">{t.title}</div>
                    <div className="task-category">{t.category === 'design' ? 'Design Systems' : t.category === 'dev' ? 'Software Development' : 'General'}</div>
                  </td>
                  <td>{formatDate(t.createdAt)}</td>
                  <td className="budget-cell">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(t.budget)}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon-action"
                        title="View Task Details"
                        onClick={() => setViewingTask(t)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label={`View details of ${t.title}`}
                      >
                        <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        className="btn-icon-action"
                        title="Edit Task"
                        onClick={() => onNavigate('post-gig', { editId: t.task_id })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label={`Edit ${t.title}`}
                      >
                        <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task Activity (Active Projects without progress bar column) */}
      <div className="activity-section">
        <div className="activity-header">
          <h2 className="activity-title">Task Activity</h2>
          <a
            href="#my-gigs"
            onClick={(e) => { e.preventDefault(); onNavigate('my-gigs'); }}
            className="activity-link"
          >
            View All Projects &rarr;
          </a>
        </div>

        <table className="activity-table" id="client-activity-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nonOpenTasks.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xl)' }}>
                  No active projects yet.
                </td>
              </tr>
            ) : (
              nonOpenTasks.map(t => {
                return (
                  <tr key={t.task_id}>
                    <td>
                      <div className="task-name-cell">{t.title}</div>
                      <div className="task-category">{t.category === 'design' ? 'Design Systems' : t.category === 'dev' ? 'Software Development' : 'General'}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="budget-cell">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(t.budget)}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-icon-action"
                          title="View deliverables"
                          onClick={() => onNavigate('review-deliverables', { taskId: t.task_id })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <a
          href="#my-gigs"
          onClick={(e) => { e.preventDefault(); onNavigate('my-gigs'); }}
          className="show-more-link"
        >
          Show More Activity &rarr;
        </a>
      </div>

      {/* Task Details Modal */}
      {viewingTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setViewingTask(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: '#EBF4F6',
                    color: '#084B83',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {viewingTask.category === 'design' ? 'Design Systems' : viewingTask.category === 'dev' ? 'Software Development' : 'General'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#084B83', margin: '8px 0 0 0' }}>
                  {viewingTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Key Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                backgroundColor: '#F8FAFB',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Budget</span>
                <strong style={{ fontSize: '15px', color: '#084B83' }}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(viewingTask.budget)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Status</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#D47700' }}>
                  ● Open for Hire
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Posted Date</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatDate(viewingTask.createdAt)}</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                Task Description
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                {viewingTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Skills */}
            {viewingTask.skills && viewingTask.skills.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Required Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {viewingTask.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#EFF6F7',
                        color: '#084B83',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Status */}
            {(() => {
              const taskApps = applications.filter(a => String(a.task_id) === String(viewingTask.task_id));
              return (
                <div
                  style={{
                    backgroundColor: taskApps.length > 0 ? '#EFF6F7' : '#FFF9F2',
                    border: `1px solid ${taskApps.length > 0 ? '#D5E5E9' : '#FFE8D1'}`,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-dark)' }}>
                      {taskApps.length > 0
                        ? `📌 ${taskApps.length} Candidate(s) Applied`
                        : '📌 0 Candidates Applied So Far'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {taskApps.length > 0
                        ? 'Review candidates and approve hire to start contract.'
                        : 'Task is currently visible to talent on the marketplace.'}
                    </div>
                  </div>
                  {taskApps.length > 0 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => {
                        const tId = viewingTask.task_id;
                        setViewingTask(null);
                        onNavigate('review-shortlist', { taskId: tId });
                      }}
                    >
                      Review Candidates ({taskApps.length})
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: '#FFFFFF' }}
                      onClick={() => {
                        setViewingTask(null);
                        onNavigate('search-talent');
                      }}
                    >
                      Browse Talent &amp; Invite
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setViewingTask(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => {
                  const editId = viewingTask.task_id;
                  setViewingTask(null);
                  onNavigate('post-gig', { editId });
                }}
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
