import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { useAuth } from '../../../context/AuthContext';

export interface ClientDashboardProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { tasks, contracts, loading, error } = useClient();

  // Metrics
  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const openTasks = tasks.filter(t => t.status === 'OPEN');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const nonOpenTasks = tasks.filter(t => t.status !== 'OPEN');

  const activeCount = activeTasks.length;                                                 
  const pendingCount = openTasks.length;

  // Total spent = sum of completed tasks' budgets. There is no payment
  // ledger exposed to clients on the backend, so this is the closest real
  // approximation (no fabricated "base" amount added).
  const totalSpent = completedTasks.reduce((sum, t) => sum + t.budget, 0);
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

  // Real progress comes from the matching contract (derived server-side from
  // deliverable completion); fall back to 0/100 for tasks with no contract yet.
  const getProgressPercent = (taskId: string, status: string) => {
    const contract = contracts.find(c => c.task_id === taskId);
    if (contract) return contract.progress;
    return status === 'COMPLETED' ? 100 : 0;
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
      {/* Welcome hero banner — mirrors the Gig/Manager portal headers */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #0c61a6 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff', marginBottom: 'var(--spacing-xs)' }} id="client-greeting">
          Welcome back, {user?.name || 'there'}!
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)' }}>
          Here's a summary of your workspace activities for today.
        </p>
      </div>

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
          <div className="metric-label">Active Tasks</div>
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
                        title="View Applications"
                        onClick={() => onNavigate('review-shortlist', { taskId: t.task_id })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        className="btn-icon-action"
                        title="Edit"
                        onClick={() => onNavigate('post-gig', { editId: t.task_id })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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

      {/* Task Activity */}
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
              <th>Progress</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nonOpenTasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xl)' }}>
                  No active projects yet.
                </td>
              </tr>
            ) : (
              nonOpenTasks.map(t => {
                const pct = getProgressPercent(t.task_id, t.status);
                const progressFillClass = t.status === 'COMPLETED'
                  ? 'progress-bar-fill-seagrass'
                  : t.status === 'REVIEWING'
                    ? 'progress-bar-fill-copper'
                    : 'progress-bar-fill-blue';
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
                    <td className="progress-cell">
                      <div className="progress-bar-track">
                        <div className={`progress-bar-fill ${progressFillClass}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="progress-label">{pct}%</div>
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

    </div>
  );
};

export default ClientDashboard;
