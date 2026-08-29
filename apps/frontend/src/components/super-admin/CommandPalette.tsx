import React, { useState, useEffect, useRef } from 'react';
import {
  DashboardIcon,
  AnalyticsIcon,
  UsersIcon,
  ClientIcon,
  GigProIcon,
  ManagerIcon,
  PaymentIcon,
  ProjectIcon,
  ReviewIcon,
  DisputeIcon,
  SettingsIcon,
  ShieldIcon,
  SearchIcon
} from './Icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

interface NavItemDef {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  keywords: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: NavItemDef[] = [
    { id: 'dashboard', label: 'Dashboard & Platform KPIs', category: 'Analytics', icon: <DashboardIcon size={18} />, keywords: ['home', 'overview', 'kpi', 'revenue'] },
    { id: 'analytics', label: 'Analytics & Financial Velocity', category: 'Analytics', icon: <AnalyticsIcon size={18} />, keywords: ['charts', 'take rate', 'rake', 'volume', 'gmv'] },
    { id: 'clients', label: 'Client Organizations & KYC', category: 'Management', icon: <ClientIcon size={18} />, keywords: ['organizations', 'enterprise', 'buyers', 'kyc'] },
    { id: 'gig-pros', label: 'Gig Professionals & Talent', category: 'Management', icon: <GigProIcon size={18} />, keywords: ['freelancers', 'contractors', 'skills', 'verified pro'] },
    { id: 'managers', label: 'Manager Oversight & Hierarchy', category: 'Management', icon: <ManagerIcon size={18} />, keywords: ['supervisors', 'teams', 'seats'] },
    { id: 'projects', label: 'Projects & Tasks Monitor', category: 'Operations', icon: <ProjectIcon size={18} />, keywords: ['contracts', 'deliverables', 'milestones', 'status'] },
    { id: 'payments', label: 'Financial Ledger & Escrow Overrides', category: 'Financial', icon: <PaymentIcon size={18} />, keywords: ['escrow', 'transactions', 'payouts', 'funds'] },
    { id: 'reviews', label: 'Reviews & Reputation Moderation', category: 'Operations', icon: <ReviewIcon size={18} />, keywords: ['feedback', 'stars', 'ratings', 'profanity'] },
    { id: 'disputes', label: 'Arbitration Court & Dispute Docket', category: 'Operations', icon: <DisputeIcon size={18} />, keywords: ['claims', 'evidence', 'settlement', 'refund'] },
    { id: 'admin-staff', label: 'Admin Staff & Delegation Tokens', category: 'Governance', icon: <UsersIcon size={18} />, keywords: ['invitations', 'roles', 'permissions', 'audit logs'] },
    { id: 'profile', label: 'Admin Profile & 2FA Security', category: 'Governance', icon: <ShieldIcon size={18} />, keywords: ['password', 'totp', 'sessions', 'security'] },
    { id: 'settings', label: 'Platform Settings & Commission Rake', category: 'Governance', icon: <SettingsIcon size={18} />, keywords: ['take rate', 'minimum budget', 'maintenance', 'taxonomy'] }
  ];

  const filtered = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onNavigate(filtered[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 75, 131, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(8, 75, 131, 0.1)',
          overflow: 'hidden',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid #dbdfdf'
        }}
      >
        {/* Search Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid #dbdfdf',
            backgroundColor: '#f0f6f6'
          }}
        >
          <SearchIcon size={20} color="var(--color-primary-dark)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, page, or search keyword..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#502419',
              backgroundColor: 'transparent'
            }}
          />
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#805c54',
              backgroundColor: '#ffffff',
              border: '1px solid #dbdfdf',
              borderRadius: '4px'
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#805c54', fontSize: '14px' }}>
              No matching pages or commands found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(8, 75, 131, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        color: isSelected ? 'var(--color-primary-dark)' : '#805c54',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--color-primary-dark)' : '#502419'
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#805c54' }}>{item.category}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-primary-blue)',
                        fontWeight: 600
                      }}
                    >
                      Jump to page ↵
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#FAFBFB',
            borderTop: '1px solid #dbdfdf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#805c54'
          }}
        >
          <span>Use ↑ ↓ to navigate, ↵ to select</span>
          <span>Press <strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>
  );
};
