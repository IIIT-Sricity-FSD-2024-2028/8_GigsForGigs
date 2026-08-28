import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface AddManagerFlowProps {
  onNavigate: (viewId: string) => void;
}

export const AddManagerFlow: React.FC<AddManagerFlowProps> = ({ onNavigate }) => {
  const { inviteManager, managers } = useClient();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Email is required');
      return;
    }

    try {
      // Create a manager with generic name from email prefix
      const name = email.split('@')[0];
      await inviteManager(name.charAt(0).toUpperCase() + name.slice(1), email);
      alert('Manager invited successfully!');
      onNavigate('profile-selection');
    } catch (err) {
      console.error('Invite manager failed:', err);
      alert('Failed to send the manager invite. Please try again.');
    }
  };

  return (
    <div className="profile-chooser" style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      
      {/* Background Content (Blurred) */}
      <div style={{ filter: 'blur(4px)', width: '100%', pointerEvents: 'none' }}>
        <header className="chooser-header container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-lg) var(--spacing-lg)' }}>
          <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary-dark)"><circle cx="12" cy="12" r="10"/></svg>
            GigsForGigs
          </div>
        </header>

        <main className="chooser-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <h1 className="chooser-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--color-primary-dark)', marginBottom: '3rem', fontWeight: 700 }}>
            Who's using this account?
          </h1>
          <div className="profile-grid" style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <button className="profile-avatar-btn" type="button">
              <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                A
              </div>
              <div style={{ marginTop: 'var(--spacing-sm)' }}><span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>Admin</span></div>
            </button>
            
            {managers.map(mgr => (
              <button key={mgr.invite_id} className="profile-avatar-btn" type="button">
                <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-blue)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700 }}>
                  {mgr.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ marginTop: 'var(--spacing-sm)' }}><span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>{mgr.name}</span></div>
              </button>
            ))}

            <button className="profile-avatar-btn add-profile-btn" type="button">
              <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--color-primary-dark)' }}>
                +
              </div>
              <div style={{ marginTop: 'var(--spacing-sm)' }}><span className="avatar-name" style={{ fontSize: '1.125rem', color: 'var(--color-text-dark)', fontWeight: 500 }}>Add Manager</span></div>
            </button>
          </div>
        </main>
      </div>

      {/* Overlay Modal */}
      <div
        className="invitation-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(240, 246, 246, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          className="invitation-modal"
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '40px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(80, 36, 25, 0.15)',
            width: '100%',
            maxWidth: '480px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', backgroundColor: 'rgba(8, 75, 131, 0.1)', borderRadius: '50%', color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-lg)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-sm)', fontWeight: 700 }}>
            Add a Manager
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xl)' }}>
            Invite a colleague to post initial requests, review talent, and manage day-to-day gig operations.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
              <label className="form-label" htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                Colleague's Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="manager@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, textDecoration: 'none' }}
                onClick={() => onNavigate('profile-selection')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, border: 'none' }}>
                Send Invite &rarr;
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default AddManagerFlow;
