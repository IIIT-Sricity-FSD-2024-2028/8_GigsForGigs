import React from 'react';
import { DashboardWelcome } from '../../../common/dashboard/DashboardWelcome/DashboardWelcome';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';

export interface DashboardSummaryProps { userName: string; services: number; activeTasks: number; pendingRequests: number; completedProjects: number; actions?: React.ReactNode; }
export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ userName, services, activeTasks, pendingRequests, completedProjects, actions }) =>
  <div className="gig-dashboard-summary"><DashboardWelcome title={`Welcome back, ${userName}!`} description="Manage services, client requests, and ongoing work." actions={actions} /><SummaryGrid>
    <SummaryCard title="My services" value={services} description="Your published offerings" />
    <SummaryCard title="Active tasks" value={activeTasks} description="Work in progress" />
    <SummaryCard title="Pending requests" value={pendingRequests} description="Awaiting your response" />
    <SummaryCard title="Completed projects" value={completedProjects} />
  </SummaryGrid></div>;
export default DashboardSummary;
