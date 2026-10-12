import React from 'react';
import type { EarningsSummary as EarningsData } from '../../../../types/gig';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';

export interface EarningsSummaryProps { summary: EarningsData; currency?: string; }
export const EarningsSummary: React.FC<EarningsSummaryProps> = ({ summary, currency = 'INR' }) => {
  const format = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  return <DashboardSection title="Earnings overview"><SummaryGrid><SummaryCard title="Total earnings" value={format(summary.totalEarnings)} /><SummaryCard title="Completed tasks" value={summary.completedTasks} />
    {summary.payments.slice(0, 4).map(payment => <SummaryCard key={payment.paymentId} title={payment.task?.title || `Payment #${payment.paymentId}`} value={format(payment.amount)} description={payment.status} />)}
  </SummaryGrid></DashboardSection>;
};
export default EarningsSummary;
