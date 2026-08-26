import React from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useManager } from '../../context/ManagerContext/ManagerContext';

export interface ManagerLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'talent' | 'tasks' | 'task-detail' | 'profile') => void;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { logoutManager } = useAuth();
  const { profile } = useManager();

  const managerName = profile?.user?.name || 'Leo Hudson';
  const initials = managerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LE';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#EFF6F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          backgroundColor: '#0D568D',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 0',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header Branding */}
        <div>
          <div style={{ padding: '0 24px 28px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.3px', lineHeight: 1.2 }}>GigsForGigs</div>
              <div style={{ fontSize: '10px', color: '#B8D0E0', letterSpacing: '1px', fontWeight: 600, marginTop: '2px' }}>MANAGER DASHBOARD</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 24px',
                backgroundColor: activeTab === 'dashboard' ? '#1F6598' : 'transparent',
                borderLeft: activeTab === 'dashboard' ? '4px solid #D47700' : '4px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: activeTab === 'dashboard' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('talent')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 24px',
                backgroundColor: activeTab === 'talent' ? '#1F6598' : 'transparent',
                borderLeft: activeTab === 'talent' ? '4px solid #D47700' : '4px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: activeTab === 'talent' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search Talent
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 24px',
                backgroundColor: (activeTab === 'tasks' || activeTab === 'task-detail') ? '#1F6598' : 'transparent',
                borderLeft: (activeTab === 'tasks' || activeTab === 'task-detail') ? '4px solid #D47700' : '4px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: (activeTab === 'tasks' || activeTab === 'task-detail') ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Assigned Tasks
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 24px',
                backgroundColor: activeTab === 'profile' ? '#1F6598' : 'transparent',
                borderLeft: activeTab === 'profile' ? '4px solid #D47700' : '4px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: activeTab === 'profile' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </button>
          </nav>
        </div>

        {/* Footer Profile Area */}
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#D47700',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{managerName}</div>
              <div style={{ fontSize: '11px', color: '#B8D0E0', whiteSpace: 'nowrap' }}>Manager Account</div>
            </div>
          </div>
          <button
            onClick={() => logoutManager()}
            style={{
              backgroundColor: '#D47700',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
};

export default ManagerLayout;
