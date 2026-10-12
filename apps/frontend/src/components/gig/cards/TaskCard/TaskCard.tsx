import React from 'react';
import type { GigTask } from '../../../../types/gig';
import { TaskCard as SharedTaskCard } from '../../../common/cards/TaskCard/TaskCard';

export interface GigTaskCardProps { task: GigTask; onSelect?: (task: GigTask) => void; actions?: React.ReactNode; }
export const TaskCard: React.FC<GigTaskCardProps> = ({ task, onSelect, actions }) =>
  <SharedTaskCard title={task.title} description={task.description} status={task.status} budget={`₹${task.budget.toLocaleString('en-IN')}`}
    actions={actions || (onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(task)}>View task</button>)} />;
export default TaskCard;
