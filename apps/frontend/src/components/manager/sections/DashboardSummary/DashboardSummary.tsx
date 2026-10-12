import React from 'react';
import { DashboardWelcome } from '../../../common/dashboard/DashboardWelcome/DashboardWelcome';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';

export interface ManagerDashboardSummaryProps { managerName: string; activeTasks: number; pendingTasks: number; pendingReviews: number; actions?: React.ReactNode; }
export const DashboardSummary: React.FC<ManagerDashboardSummaryProps> = ({ managerName, activeTasks, pendingTasks, pendingReviews, actions }) =>
  <div className="manager-dashboard-summary"><DashboardWelcome title={`Welcome back, ${managerName}!`} description="Review assigned work and keep hiring activity moving." actions={actions} /><SummaryGrid>
    <SummaryCard title="Active tasks" value={activeTasks} description="Currently in progress" />
    <SummaryCard title="Pending tasks" value={pendingTasks} description="Not yet started" />
    <SummaryCard title="Deliverables to review" value={pendingReviews} description="Awaiting your feedback" />
  </SummaryGrid></div>;
export default DashboardSummary;
