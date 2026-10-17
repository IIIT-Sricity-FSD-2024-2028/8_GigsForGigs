import React from 'react';
import { BaseCard } from '../BaseCard/BaseCard';
import { StatusBadge } from '../../status/StatusBadge/StatusBadge';

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  status?: string;
  budget?: React.ReactNode;
  clientName?: string;
  actions?: React.ReactNode;
}

/** Card for a project: title/description, status badge top-right, and a footer with client name, budget and actions. */
export const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, status, budget, clientName, actions, children, className = '', ...props }) =>
  <BaseCard title={title} description={description} className={`project-card ${className}`.trim()} actions={status && <StatusBadge status={status} />} {...props}>
    {children}
    <div className="project-card__meta">{clientName && <span>{clientName}</span>}{budget !== undefined && <strong>{budget}</strong>}{actions}</div>
  </BaseCard>;

export default ProjectCard;
