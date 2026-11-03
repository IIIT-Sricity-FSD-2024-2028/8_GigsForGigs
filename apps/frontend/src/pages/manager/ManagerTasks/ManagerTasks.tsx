import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { Button } from '../../../components/common';
import { Loader } from '../../../components/common/Loader';
import { DashboardSection } from '../../../components/common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../components/common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../../components/common/cards/TaskCard/TaskCard';

interface ManagerTasksProps {
  onSelectTask: (taskId: number) => void;
  showCompleted?: boolean;
}

/** Active and completed manager tasks use the shared task cards and responsive grid. */
export const ManagerTasks: React.FC<ManagerTasksProps> = ({ onSelectTask, showCompleted = false }) => {
  const { tasks, loading } = useManager();
  const visibleTasks = tasks.filter(task => (task.status === 'completed') === showCompleted);
  const title = showCompleted ? 'Completed Projects' : 'Active Tasks';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading ? (
        <Loader label={`Loading ${title.toLowerCase()}...`} />
      ) : visibleTasks.length === 0 ? (
        <DashboardSection title={title} description={showCompleted ? 'Completed tasks will appear here.' : 'Tasks that are not yet completed appear here.'}>
          <p style={{ color: '#475764', fontSize: '14px' }}>{showCompleted ? 'You have no completed projects yet.' : 'Tasks shared with you by your client will appear here.'}</p>
        </DashboardSection>
      ) : (
        <DashboardSection title={title} description={`${visibleTasks.length} ${showCompleted ? 'completed project' : 'incomplete task'}${visibleTasks.length === 1 ? '' : 's'}`}>
          <SummaryGrid minCardWidth="280px">
            {visibleTasks.map(task => (
              <TaskCard
                key={task.taskId}
                title={task.title}
                description={task.description || 'No detailed description provided.'}
                status={task.status.replace('_', ' ')}
                clientName={task.client?.clientName || 'Client'}
                budget={`₹${Number(task.budget).toLocaleString('en-IN')}`}
                progress={task.progress ?? (task.status === 'completed' ? 100 : 50)}
                actions={<Button size="sm" onClick={() => onSelectTask(task.taskId)}>View task & subtasks</Button>}
              />
            ))}
          </SummaryGrid>
        </DashboardSection>
      )}
    </div>
  );
};

export default ManagerTasks;
