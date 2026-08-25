import React from 'react';

export interface EmptyStateProps {
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = () => {
  return null;
};

export default EmptyState;
