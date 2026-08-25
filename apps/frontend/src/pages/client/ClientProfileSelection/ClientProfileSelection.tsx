import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useClient } from '../../../context/ClientContext';

export interface ClientProfileSelectionProps {
  onNavigate: (viewId: string) => void;
}

export const ClientProfileSelection: React.FC<ClientProfileSelectionProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { managers, deleteManager } = useClient();

  const handleProfileSelect = async (role: string, email: string) => {
    await login(email, role);
    onNavigate('dashboard');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to remove this manager?')) {
      deleteManager(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Minimal Header */}
      <header className="chooser-header container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-lg) var(--spacing-lg)' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); }} className="logo" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary-dark)"><circle cx="12" cy="12" r="10"/></svg>
          GigsForGigs
        </a>
      </header>

      <main className="chooser-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="chooser-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--color-primary-dark)', marginBottom: '3rem', fontWeight: 700 }}>
          Who's using this account?
        </h1>
        
        {managers.length === 0 && (
          <p id="first-time-profile-note" style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
            No manager accounts yet.
          </p>
        )}

        <div className="profile-grid" style={{ display: 'flex', gap: '2rem', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'flex-start' }}>
          
          {/* Admin Profile */}
          <button
            onClick={() => handleProfileSelect('CLIENT', 'aditya@gigsforgigs.com')}
            className="profile-avatar-btn"
            type="button"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
              <span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>Admin</span>
              <span className="avatar-role" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Client Owner</span>
            </div>
          </button>

          {/* Managers List */}
          {managers.map(mgr => (
            <div
              key={mgr.invite_id}
              className="manager-profile-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', width: '170px' }}
            >
              <button
                onClick={() => handleProfileSelect('MANAGER', mgr.email)}
                className="profile-avatar-btn"
                type="button"
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div
                  className="avatar-square"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-blue)',
                    color: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 700
                  }}
                >
                  {mgr.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
                  <span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>{mgr.name}</span>
                  <span className="avatar-role" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manager</span>
                </div>
              </button>

              <div className="manager-action-zone" style={{ marginTop: 'var(--spacing-md)', minHeight: '30px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={(e) => handleDelete(e, mgr.invite_id)}
                  className="manager-delete-icon-btn"
                  title="Remove manager"
                  aria-label={`Remove manager ${mgr.name}`}
                  type="button"
                >
                  <svg className="manager-delete-icon" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Add Manager */}
          <button
            onClick={() => onNavigate('add-manager')}
            className="profile-avatar-btn add-profile-btn"
            type="button"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--color-primary-dark)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
              <span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>Add Manager</span>
            </div>
          </button>

        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        &copy; 2026 GigsForGigs. All Rights Reserved.
      </footer>
    </div>
  );
};

export default ClientProfileSelection;
