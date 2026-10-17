import React from 'react';

export interface ProgressBarProps extends Omit<React.ProgressHTMLAttributes<HTMLProgressElement>, 'value' | 'max'> { value: number; max?: number; label?: string; showValue?: boolean; }
/** Native <progress> bar. `value` is clamped to 0..max; `showValue` prints the percentage next to the label. */
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, showValue = false, className = '', ...props }) => {
  const normalized = Math.min(max, Math.max(0, value));
  return <div className={`ui-progress ${className}`.trim()}>{label && <div className="ui-progress__label"><span>{label}</span>{showValue && <span>{Math.round(normalized / max * 100)}%</span>}</div>}<progress className="ui-progress__track" value={normalized} max={max} aria-label={label} {...props} /></div>;
};
export default ProgressBar;
