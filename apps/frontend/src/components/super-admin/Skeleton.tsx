import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  style
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E2E8F0',
        backgroundImage: 'linear-gradient(90deg, #E2E8F0 0px, #F1F5F9 40px, #E2E8F0 80px)',
        backgroundSize: '300px',
        animation: 'shimmer 1.5s infinite linear',
        ...style
      }}
    />
  );
};
