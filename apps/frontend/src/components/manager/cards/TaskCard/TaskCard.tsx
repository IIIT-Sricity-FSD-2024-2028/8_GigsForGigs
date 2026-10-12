import React from 'react';
import type { ManagerTask } from '../../../../types/manager';
import { TaskCard as SharedTaskCard } from '../../../common/cards/TaskCard/TaskCard';

export interface ManagerTaskCardProps { task: ManagerTask; actions?: React.ReactNode; onSelect?: (task: ManagerTask) => void; }
export const TaskCard: React.FC<ManagerTaskCardProps> = ({ task, actions, onSelect }) =>
  <SharedTaskCard title={task.title} description={task.description || undefined} status={task.status} progress={task.progress}
    budget={`₹${Number(task.budget).toLocaleString('en-IN')}`} actions={actions || (onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(task)}>Review task</button>)} />;
export default TaskCard;
