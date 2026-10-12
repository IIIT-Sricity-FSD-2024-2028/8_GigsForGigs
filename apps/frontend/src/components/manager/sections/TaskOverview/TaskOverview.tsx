import React from 'react';
import type { ManagerTask } from '../../../../types/manager';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../cards/TaskCard/TaskCard';
import { EmptyState } from '../../../common/EmptyState/EmptyState';

export interface TaskOverviewProps { tasks: ManagerTask[]; onSelect?: (task: ManagerTask) => void; }
export const TaskOverview: React.FC<TaskOverviewProps> = ({ tasks, onSelect }) =>
  <DashboardSection title="Assigned tasks" description="Current progress across your client's work">{tasks.length ? <SummaryGrid>{tasks.map(task => <TaskCard key={task.taskId} task={task} onSelect={onSelect} />)}</SummaryGrid> : <EmptyState title="No assigned tasks" description="Tasks for your client will appear here." />}</DashboardSection>;
export default TaskOverview;
