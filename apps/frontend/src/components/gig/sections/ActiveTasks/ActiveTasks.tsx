import React from 'react';
import type { GigTask } from '../../../../types/gig';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../cards/TaskCard/TaskCard';
import { EmptyState } from '../../../common/EmptyState/EmptyState';

export interface ActiveTasksProps { tasks: GigTask[]; onSelect?: (task: GigTask) => void; onSubmitDeliverable?: (task: GigTask) => void; }
export const ActiveTasks: React.FC<ActiveTasksProps> = ({ tasks, onSelect, onSubmitDeliverable }) =>
  <DashboardSection title="Active tasks" description="Current client work and delivery progress">{tasks.length ? <SummaryGrid>{tasks.map(task => <TaskCard key={task.taskId} task={task} onSelect={onSelect} actions={onSubmitDeliverable && <button type="button" className="ui-button ui-button--primary ui-button--sm" onClick={() => onSubmitDeliverable(task)}>Submit deliverable</button>} />)}</SummaryGrid> : <EmptyState title="No active tasks" description="Tasks assigned to you will appear here." />}</DashboardSection>;
export default ActiveTasks;
