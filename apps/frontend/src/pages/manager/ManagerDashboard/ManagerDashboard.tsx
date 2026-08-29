import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

interface ManagerDashboardProps {
  onNavigateToTask: (taskId: number) => void;
  onNavigateToQueue: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateToTask, onNavigateToQueue }) => {
  const { profile, tasks, deliverables, reviewDeliverable, closeDeliverable } = useManager();

  const managerName = profile?.user?.name || 'Manager';
  const pendingTasks = tasks.filter(t => t.status === 'open');
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingDeliverables = deliverables.filter(d => d.status === 'submitted');

  const formatBudget = (budget: number | string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(budget));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      default: return 'status-scheduled';
    }
  };

  const getProgress = (task: typeof tasks[number]) =>
    task.progress ?? (task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Welcome hero banner — mirrors the Gig portal's gradient header */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #0c61a6 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff', marginBottom: 'var(--spacing-xs)' }}>
            Welcome back, {managerName}!
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)' }}>
            Here's a summary of your hiring activity and assigned operational tasks.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-outline"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          onClick={onNavigateToQueue}
        >
          Go to Pending Queue &rarr;
        </button>
      </div>

      {/* Metric cards row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-card-head">
            <div className="metric-icon metric-icon-blue">
              <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span className="metric-badge metric-badge-neutral">Assigned</span>
          </div>
          <div className="metric-label">Active Tasks</div>
          <div className="metric-value">{activeTasks.length}</div>
          <div className="metric-description">Currently in progress</div>
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
          <div className="metric-value">{String(pendingTasks.length).padStart(2, '0')}</div>
          <div className="metric-description">Not yet started</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-head">
            <div className="metric-icon metric-icon-seagrass">
              <svg fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <span className="metric-badge metric-badge-up">Awaiting Review</span>
          </div>
          <div className="metric-label">Pending Deliverables</div>
          <div className="metric-value">{pendingDeliverables.length}</div>
          <div className="metric-description">Submitted by gig professionals</div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="activity-section">
        <div className="activity-header">
          <h2 className="activity-title">
            Pending Tasks{' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '6px' }}>
              ({pendingTasks.length})
            </span>
          </h2>
        </div>
        <table className="activity-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Client</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingTasks.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xl)' }}>
                  No pending tasks — everything assigned to you is underway.
                </td>
              </tr>
            ) : (
              pendingTasks.map(task => (
                <tr key={task.taskId}>
                  <td>
                    <div className="task-name-cell">{task.title}</div>
                  </td>
                  <td>{task.client?.clientName ?? '—'}</td>
                  <td className="budget-cell">{formatBudget(task.budget)}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon-action"
                        title="View task details"
                        onClick={() => onNavigateToTask(task.taskId)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Project Activity */}
      <div className="activity-section">
        <div className="activity-header">
          <h2 className="activity-title">Recent Project Activity</h2>
        </div>
        <table className="activity-table">
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
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-xl)' }}>
                  No assigned tasks found.
                </td>
              </tr>
            ) : (
              tasks.map(task => {
                const pct = getProgress(task);
                const fillClass = task.status === 'completed'
                  ? 'progress-bar-fill-seagrass'
                  : task.status === 'in_progress'
                    ? 'progress-bar-fill-blue'
                    : 'progress-bar-fill-copper';
                return (
                  <tr key={task.taskId}>
                    <td>
                      <div className="task-name-cell">{task.title}</div>
                      <div className="task-category">
                        {task.assignments?.[0]?.gigProfile?.user?.name
                          ? `Assigned to: ${task.assignments[0].gigProfile.user.name}`
                          : 'Client delegated'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="progress-cell">
                      <div className="progress-bar-track">
                        <div className={`progress-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="progress-label">{pct}%</div>
                    </td>
                    <td className="budget-cell">{formatBudget(task.budget)}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-icon-action"
                          title="View task details & deliverables"
                          onClick={() => onNavigateToTask(task.taskId)}
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
      </div>

      {/* Pending Deliverables Awaiting Review — always visible, no toggle */}
      <div className="activity-section">
        <div className="activity-header">
          <h2 className="activity-title">
            Pending Deliverables Awaiting Review{' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '6px' }}>
              ({pendingDeliverables.length})
            </span>
          </h2>
        </div>
        {pendingDeliverables.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            No deliverables currently awaiting review.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {pendingDeliverables.map(del => (
              <div
                key={`${del.taskId}-${del.deliverableNo}`}
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-md)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div className="task-name-cell">
                    Deliverable #{del.deliverableNo}: {del.description}
                  </div>
                  <div className="task-category">
                    Link: <a href={del.submissionPath} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-dark)' }}>{del.submissionPath}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    onClick={() => reviewDeliverable(del.taskId, del.deliverableNo, { status: 'approved' })}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    onClick={() => closeDeliverable(del.taskId, del.deliverableNo)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
