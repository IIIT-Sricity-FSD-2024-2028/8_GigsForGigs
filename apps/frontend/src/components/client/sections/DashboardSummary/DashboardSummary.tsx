import React from 'react';
import { DashboardWelcome } from '../../../common/dashboard/DashboardWelcome/DashboardWelcome';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';

export interface DashboardSummaryProps { userName: string; activeTasks: number; openTasks: number; completedTasks: number; totalSpent: React.ReactNode; actions?: React.ReactNode; }
export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ userName, activeTasks, openTasks, completedTasks, totalSpent, actions }) =>
  <div className="client-dashboard-summary"><DashboardWelcome title={`Welcome back, ${userName}!`} description="Here’s a summary of your workspace activities." actions={actions} /><SummaryGrid>
    <SummaryCard title="Active tasks" value={activeTasks} description="Approved and in progress" />
    <SummaryCard title="Open tasks" value={openTasks} description="Awaiting a professional" />
    <SummaryCard title="Completed tasks" value={completedTasks} />
    <SummaryCard title="Total spent" value={totalSpent} />
  </SummaryGrid></div>;
export default DashboardSummary;
