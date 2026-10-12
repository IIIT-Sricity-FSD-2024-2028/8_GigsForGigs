import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  { children, className = '', wrapperClassName = '', ...props }, ref
) {
  return <div className={`ui-table-wrap ${wrapperClassName}`.trim()}><table ref={ref} className={`ui-table ${className}`.trim()} {...props}>{children}</table></div>;
});

export default Table;
