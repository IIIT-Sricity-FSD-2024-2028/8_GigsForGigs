import React from 'react';
import { PageHeader } from '../../PageHeader/PageHeader';

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = (props) => <PageHeader {...props} className={`dashboard-page-header ${props.className || ''}`} />;
export default DashboardHeader;
