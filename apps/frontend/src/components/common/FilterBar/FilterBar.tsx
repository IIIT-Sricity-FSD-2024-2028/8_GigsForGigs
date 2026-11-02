import React from 'react';

/** Row that lays out a SearchBar and filter Selects, wrapping on small screens. */
export const FilterBar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) =>
  <div className={`ui-filter-bar ${className}`.trim()} {...props}>{children}</div>;

export default FilterBar;
