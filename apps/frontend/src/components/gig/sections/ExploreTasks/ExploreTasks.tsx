import React from 'react';
import type { GigTask } from '../../../../types/gig';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { TaskCard } from '../../cards/TaskCard/TaskCard';
import { EmptyState } from '../../../common/EmptyState/EmptyState';

export interface ExploreTasksProps { tasks: GigTask[]; appliedTaskIds?: number[]; onApply?: (task: GigTask) => void; }
export const ExploreTasks: React.FC<ExploreTasksProps> = ({ tasks, appliedTaskIds = [], onApply }) =>
  <DashboardSection title="Explore tasks" description="Open opportunities from clients">{tasks.length ? <SummaryGrid>{tasks.map(task => <TaskCard key={task.taskId} task={task} actions={onApply && <button type="button" className="ui-button ui-button--primary ui-button--sm" disabled={appliedTaskIds.includes(task.taskId)} onClick={() => onApply(task)}>{appliedTaskIds.includes(task.taskId) ? 'Applied' : 'Apply'}</button>} />)}</SummaryGrid> : <EmptyState title="No tasks available" description="New opportunities will appear here." />}</DashboardSection>;
export default ExploreTasks;
