import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

interface ManagerDashboardProps {
  onNavigateToTask: (taskId: number) => void;
  onNavigateToQueue: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateToTask, onNavigateToQueue }) => {
  const { profile, tasks, deliverables, reviewDeliverable, closeDeliverable } = useManager();

  const managerName = profile?.user?.name || 'Manager';
  const hiringClientName = profile?.client?.clientName || 'Assigned Client Organization';
  const pendingTasks = tasks.filter(t => t.status === 'open');
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingDeliverables = deliverables.filter(d => d.status === 'submitted');

  // Collect unique gig professionals accepted by this client across tasks
  const acceptedProfessionals = Array.from(
    new Map(
      tasks
        .flatMap(t => (t.assignments || []).map(a => ({ ...a, taskTitle: t.title, taskStatus: t.status })))
        .filter(a => a.gigProfile)
        .map(a => [
          a.gigProfile!.gigProfileId,
          {
            gigProfileId: a.gigProfile!.gigProfileId,
            name: a.gigProfile!.user.name,
            email: a.gigProfile!.user.email,
            skills: a.gigProfile!.skills || [],
            taskTitle: a.taskTitle,
            taskStatus: a.taskStatus
          }
        ])
    ).values()
  );

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
      {/* Welcome hero banner — displays hiring client's name prominently */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Welcome back, {managerName}!
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 224, 130, 0.25)',
                color: '#FFE082',
                border: '1px solid rgba(255, 224, 130, 0.5)',
                padding: '4px 10px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Manager
            </span>
          </div>

          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            Supervising operational tasks and verified deliverables for your hiring organization.
          </p>

          <div
            style={{
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#FFE082' }}>
              Hired by Client:
            </span>
            <strong style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              {hiringClientName}
            </strong>
            {profile?.client?.domain && (
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                • {profile.client.domain}
              </span>
            )}
          </div>
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

      {/* Accepted Gig Professionals under this Client */}
      <div className="activity-section">
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="activity-title">
            Accepted Professionals ({hiringClientName}'s Team){' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '6px' }}>
              ({acceptedProfessionals.length})
            </span>
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Supervised under Client ID #{profile?.clientId || '—'}
          </span>
        </div>

        {acceptedProfessionals.length === 0 ? (
          <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              No gig professionals have been accepted by {hiringClientName} yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
            {acceptedProfessionals.map(pro => (
              <div
                key={pro.gigProfileId}
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary-dark)' }}>
                    {pro.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: '#E4F2EF',
                      color: '#438F82'
                    }}
                  >
                    Accepted
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {pro.email}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-main)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Active on: </span>
                  <strong>{pro.taskTitle}</strong>
                </div>

                {pro.skills && pro.skills.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {pro.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: 'var(--color-bg-light)',
                          borderRadius: '4px',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
