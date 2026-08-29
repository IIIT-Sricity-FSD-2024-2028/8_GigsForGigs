import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface AddManagerProps {
  onNavigate: (viewId: string) => void;
}

export const AddManager: React.FC<AddManagerProps> = ({ onNavigate }) => {
  const { inviteManager } = useClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Name and email are required');
      return;
    }

    try {
      await inviteManager(name, email);
      alert('Manager invited successfully!');
      onNavigate('profile-selection');
    } catch (err) {
      console.error('Add manager failed:', err);
      alert('Failed to send the manager invite. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: 'var(--spacing-md)' }}>
      <div className="modal-card" style={{ boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '480px', padding: '40px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        
        <div className="modal-icon" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(8, 75, 131, 0.1)', color: 'var(--color-primary-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto var(--spacing-lg)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
          Invite a Manager
        </h2>
        <p className="modal-subtitle" style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: 'var(--spacing-xl)' }}>
          Send an invitation so a team member can manage hiring tasks and oversee active gig postings.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
            <label className="form-label" htmlFor="manager-name" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
              Manager Name
            </label>
            <input
              type="text"
              id="manager-name"
              className="form-input"
              placeholder="e.g. David Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
            <label className="form-label" htmlFor="manager-email" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
              Manager Email Address
            </label>
            <input
              type="email"
              id="manager-email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 'var(--spacing-sm)', width: '100%', border: 'none' }}>
            Send Invite
            <svg fill="currentColor" width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: '8px' }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>

          <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start', color: 'var(--color-primary-blue)', fontSize: '0.8rem', backgroundColor: 'rgba(191, 105, 0, 0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)' }}>
            <svg width="16" height="16" style={{ flexShrink: 0, marginTop: '2px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style={{ margin: 0, lineHeight: 1.4 }}>Managers will create their profile PIN after accepting the invite to secure their access.</p>
          </div>

        </form>

        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <button
            onClick={() => onNavigate('profile-selection')}
            className="btn btn-outline btn-full btn-icon"
            style={{ justifyContent: 'center', textDecoration: 'none', width: '100%' }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddManager;
