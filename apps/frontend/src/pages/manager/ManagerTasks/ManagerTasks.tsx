import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { Button, PageHeader } from '../../../components/common';
import { Loader } from '../../../components/common/Loader';

interface ManagerTasksProps {
  onSelectTask: (taskId: number) => void;
  showCompleted?: boolean;
}

const inr = (val: number | string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val));

/** Same table as the client's Active Task page. Managers manage deliverables only: no payment or manager controls. */
export const ManagerTasks: React.FC<ManagerTasksProps> = ({ onSelectTask, showCompleted = false }) => {
  const { tasks, loading } = useManager();
  const visibleTasks = tasks.filter(task => (task.status === 'completed') === showCompleted);
  const title = showCompleted ? 'Completed Projects' : 'Active Task';

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <PageHeader title={title} description={showCompleted ? 'Completed tasks will appear here.' : 'Track ongoing work, define deliverables, and review submissions.'} />
      {loading ? (
        <Loader label={`Loading ${title.toLowerCase()}...`} />
      ) : (
        <div style={{ width: '100%', overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF' }}>
          <table className="activity-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Project Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Professional</th>
                <th style={{ textAlign: 'center', padding: '12px 16px' }}>Task Status</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Payment</th>
                <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    {showCompleted ? 'You have no completed projects yet.' : 'Tasks shared with you by your client will appear here.'}
                  </td>
                </tr>
              ) : visibleTasks.map(task => {
                const pro = task.assignments?.[0]?.gigProfile?.user?.name;
                return (
                  <tr key={task.taskId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, wordBreak: 'break-word', maxWidth: '280px' }}>{task.title}</td>
                    <td style={{ padding: '12px 16px' }}>{pro || 'Not hired yet'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${task.status === 'in_progress' ? 'status-in-progress' : 'status-scheduled'}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0D568D' }}>{inr(task.budget)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <Button size="sm" onClick={() => onSelectTask(task.taskId)}>Deliverables</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
