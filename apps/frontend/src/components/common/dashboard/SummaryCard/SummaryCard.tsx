import React from 'react';
import { StatCard } from '../../cards/StatCard/StatCard';

export interface SummaryCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ action, ...props }) => <StatCard {...props} trend={action} />;
export default SummaryCard;
