import React from 'react';
import type { AdminDashboardStats } from '../../../../types/super-admin';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';

export interface AnalyticsSummaryProps { stats: AdminDashboardStats; }
export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ stats }) =>
  <SummaryGrid><SummaryCard title="Total users" value={stats.totalUsers} /><SummaryCard title="Active tasks" value={stats.activeTasks} /><SummaryCard title="Applications" value={stats.totalApplications} /><SummaryCard title="Gross merchandise volume" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.grossMerchandiseVolume)} /><SummaryCard title="Average rating" value={stats.avgPlatformRating.toFixed(1)} /></SummaryGrid>;
export default AnalyticsSummary;
