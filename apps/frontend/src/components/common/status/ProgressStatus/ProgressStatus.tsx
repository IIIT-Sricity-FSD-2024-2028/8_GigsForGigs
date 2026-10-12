import React from 'react';
import { ProgressBar } from '../../ProgressBar/ProgressBar';

export interface ProgressStatusProps { value: number; label?: string; stages?: string[]; className?: string; }
export const ProgressStatus: React.FC<ProgressStatusProps> = ({ value, label = 'Progress', stages = [], className = '' }) =>
  <div className={`progress-status ${className}`.trim()}><ProgressBar value={value} label={label} showValue />{stages.length > 0 && <ol className="progress-status__stages">{stages.map((stage, index) => <li key={stage} className={value >= ((index + 1) / stages.length) * 100 ? 'is-complete' : ''}>{stage}</li>)}</ol>}</div>;
export default ProgressStatus;
