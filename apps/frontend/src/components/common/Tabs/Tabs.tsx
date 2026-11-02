import React from 'react';

export interface TabItem { id: string; label: React.ReactNode; count?: number; }
export interface TabsProps { tabs: TabItem[]; active: string; onChange: (id: string) => void; className?: string; }

/** Horizontal tab bar (controlled). Render the active panel yourself. */
export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) =>
  <div role="tablist" className={`ui-tabs ${className}`.trim()}>
    {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={tab.id === active}
      className={`ui-tab ${tab.id === active ? 'ui-tab--active' : ''}`.trim()} onClick={() => onChange(tab.id)}>
      {tab.label}{tab.count !== undefined && <span className="ui-tab__count">{tab.count}</span>}
    </button>)}
  </div>;

export default Tabs;
