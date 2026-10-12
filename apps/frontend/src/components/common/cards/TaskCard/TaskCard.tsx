import React from 'react';
import { ProjectCard } from '../ProjectCard/ProjectCard';
import { ProgressBar } from '../../ProgressBar/ProgressBar';

export interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  status?: string;
  budget?: React.ReactNode;
  clientName?: string;
  progress?: number;
  actions?: React.ReactNode;
}

export const TaskCard: React.FC<TaskCardProps> = ({ progress, ...props }) =>
  <ProjectCard {...props}>{progress !== undefined && <ProgressBar value={progress} aria-label="Task progress" />}</ProjectCard>;

export default TaskCard;
