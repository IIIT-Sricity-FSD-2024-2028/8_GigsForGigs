import React from 'react';
import type { AdminTask } from '../../../../types/super-admin';
import { TaskCard } from '../../../common/cards/TaskCard/TaskCard';

export interface AdminProjectCardProps { project: AdminTask; actions?: React.ReactNode; }
export const ProjectCard: React.FC<AdminProjectCardProps> = ({ project, actions }) =>
  <TaskCard title={project.title} description={project.description || undefined} status={project.status} budget={`₹${Number(project.budget).toLocaleString('en-IN')}`} clientName={project.client.clientName} actions={actions} />;
export default ProjectCard;
