import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { Button } from '../../../components/common';
import { DashboardSection } from '../../../components/common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../components/common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../../components/common/cards/TaskCard/TaskCard';

interface ManagerTasksProps {
  onSelectTask: (taskId: number) => void;
}

/** Active tasks use the same shared cards and responsive grid as client task views. */
export const ManagerTasks: React.FC<ManagerTasksProps> = ({ onSelectTask }) => {
  const { tasks, loading } = useManager();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#475764' }}>Loading active tasks...</div>
      ) : tasks.length === 0 ? (
        <DashboardSection title="Active tasks" description="No active tasks have been assigned to you yet.">
          <p style={{ color: '#475764', fontSize: '14px' }}>Tasks shared with you by your client will appear here.</p>
        </DashboardSection>
      ) : (
        <DashboardSection title="Active tasks" description={`${tasks.length} task${tasks.length === 1 ? '' : 's'} shared by your client`}>
          <SummaryGrid minCardWidth="280px">
            {tasks.map(task => (
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
