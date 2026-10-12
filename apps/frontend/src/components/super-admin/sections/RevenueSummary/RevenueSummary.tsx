import React from 'react';
import type { AdminPayment } from '../../../../types/super-admin';
import { DashboardSection } from '../../../common/dashboard/DashboardSection/DashboardSection';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';

export interface RevenueSummaryProps { payments: AdminPayment[]; }
export const RevenueSummary: React.FC<RevenueSummaryProps> = ({ payments }) => {
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const completed = payments.filter(payment => payment.status === 'completed');
  const pending = payments.filter(payment => payment.status === 'pending');
  const format = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  return <DashboardSection title="Payments summary"><SummaryGrid><SummaryCard title="Recorded payments" value={payments.length} /><SummaryCard title="Recorded amount" value={format(total)} /><SummaryCard title="Completed" value={completed.length} description={format(completed.reduce((sum, payment) => sum + Number(payment.amount), 0))} /><SummaryCard title="Pending" value={pending.length} description={format(pending.reduce((sum, payment) => sum + Number(payment.amount), 0))} /></SummaryGrid></DashboardSection>;
};
export default RevenueSummary;
