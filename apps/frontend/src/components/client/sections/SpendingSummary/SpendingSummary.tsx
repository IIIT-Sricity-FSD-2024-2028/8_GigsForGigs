import React from 'react';
import { SummaryCard } from '../../../common/dashboard/SummaryCard/SummaryCard';
import { SummaryGrid } from '../../../common/dashboard/SummaryGrid/SummaryGrid';

export interface SpendingSummaryProps { totalSpent: React.ReactNode; escrowBalance: React.ReactNode; completedPayments: number; pendingPayments: number; }
export const SpendingSummary: React.FC<SpendingSummaryProps> = ({ totalSpent, escrowBalance, completedPayments, pendingPayments }) =>
  <SummaryGrid><SummaryCard title="Total spent" value={totalSpent} description={`${completedPayments} completed payments`} /><SummaryCard title="Held in escrow" value={escrowBalance} description={`${pendingPayments} pending payments`} /></SummaryGrid>;
export default SpendingSummary;
