import React, { useState } from 'react';

export interface TabItem { id: string; label: React.ReactNode; content?: React.ReactNode; disabled?: boolean; }
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> { items: TabItem[]; activeId?: string; defaultActiveId?: string; onChange?: (id: string) => void; }
export const Tabs: React.FC<TabsProps> = ({ items, activeId, defaultActiveId, onChange, className = '', ...props }) => {
  const [internal, setInternal] = useState(defaultActiveId || items[0]?.id || '');
  const selected = activeId ?? internal;
  const activate = (id: string) => { if (activeId === undefined) setInternal(id); onChange?.(id); };
  const current = items.find(item => item.id === selected);
  return <div className={`ui-tabs ${className}`.trim()} {...props}><div role="tablist" className="ui-tabs__list">{items.map(item => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={selected === item.id} disabled={item.disabled} onClick={() => activate(item.id)}>{item.label}</button>)}</div>{current?.content !== undefined && <section role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} className="ui-tabs__panel">{current.content}</section>}</div>;
};
export default Tabs;
