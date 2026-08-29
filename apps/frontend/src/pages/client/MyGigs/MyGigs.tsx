import React from 'react';
import { useClient } from '../../../context/ClientContext';

export interface MyGigsProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const MyGigs: React.FC<MyGigsProps> = ({ onNavigate }) => {
  const { contracts, deleteTask } = useClient();

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete / cancel this contract task?')) {
      try {
        await deleteTask(taskId);
        alert('Project contract deleted successfully!');
      } catch (err) {
        console.error('Delete task failed:', err);
        alert('Failed to delete this task. Please try again.');
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'REVIEWING': return 'status-review-needed';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-scheduled';
    }
  };

  const getProgressFillClass = (status: string) => {
    if (status === 'COMPLETED') return 'progress-bar-fill-seagrass';
    if (status === 'REVIEWING') return 'progress-bar-fill-copper';
    if (status === 'IN_PROGRESS') return 'progress-bar-fill-blue';
    return 'progress-bar-fill-seagrass';
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="page-title">Active Projects</h1>
        <p className="page-subtitle">Track and manage all your ongoing contracts.</p>
      </div>

      <div className="activity-section">
        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 className="activity-title">All Contracts</h2>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.875rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', cursor: 'pointer' }}
            onClick={() => alert('Filter applied')}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>
        </div>

        <table className="activity-table" id="active-contracts-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Professional</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No active contracts found.
                </td>
              </tr>
            ) : (
              contracts.map(c => (
                <tr key={c.contract_id}>
                  <td>
                    <div className="task-name-cell">{c.task_title}</div>
                    <div className="task-category">Software Development</div>
                  </td>
                  <td>
                    <div className="pro-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="pro-photo" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {c.gig_pro_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      {c.gig_pro_name}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="progress-cell">
                    <div className="progress-bar-track">
                      <div className={`progress-bar-fill ${getProgressFillClass(c.status)}`} style={{ width: `${c.progress}%` }}></div>
                    </div>
                    <div className="progress-label">{c.progress}%</div>
                  </td>
                  <td className="budget-cell">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.budget)}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-review-proposal"
                        style={{ padding: '4px 12px', fontSize: '0.8rem', border: '1px solid var(--color-primary-blue)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-blue)', backgroundColor: 'transparent', cursor: 'pointer' }}
                        onClick={() => onNavigate('review-deliverables', { taskId: c.task_id })}
                      >
                        Review
                      </button>
                      <button
                        className="btn-icon-action"
                        title="Delete task"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: '6px' }}
                        onClick={() => handleDeleteTask(c.task_id)}
                      >
                        <svg className="manager-delete-icon" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
    </div>
  );
};

export default MyGigs;
