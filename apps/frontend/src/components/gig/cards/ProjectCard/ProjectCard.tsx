import React from 'react';
import type { CompletedProject } from '../../../../types/gig';
import { ProjectCard as SharedProjectCard } from '../../../common/cards/ProjectCard/ProjectCard';

export interface GigProjectCardProps { project: CompletedProject; onSelect?: (project: CompletedProject) => void; }
export const ProjectCard: React.FC<GigProjectCardProps> = ({ project, onSelect }) =>
  <SharedProjectCard title={project.title} description={project.description} status={project.status} clientName={project.client?.clientName}
    budget={`₹${project.budget.toLocaleString('en-IN')}`} actions={onSelect && <button type="button" className="ui-button ui-button--outline ui-button--sm" onClick={() => onSelect(project)}>View project</button>} />;
export default ProjectCard;
