import React from 'react';

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { className = '', onSearch, onChange, ...props }, ref
) {
  return <div className={`ui-search ${className}`.trim()}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
    <input ref={ref} type="search" className="ui-search__input" onChange={(event) => { onChange?.(event); onSearch?.(event.currentTarget.value); }} {...props} />
  </div>;
});

export default SearchBar;
