import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useClient, type ManagerInvite } from '../../../context/ClientContext';

export interface ClientProfileSelectionProps {
  onNavigate: (viewId: string) => void;
}

export const ClientProfileSelection: React.FC<ClientProfileSelectionProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { managers, updateManager, deleteManager } = useClient();

  const [editingManager, setEditingManager] = useState<ManagerInvite | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleProfileSelect = async (role: string, email: string, name?: string) => {
    await login(email, role, name);
    if (role === 'MANAGER') {
      onNavigate('manager-dashboard');
    } else {
      onNavigate('dashboard');
    }
  };

  const handleStartEdit = (e: React.MouseEvent, mgr: ManagerInvite) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingManager(mgr);
    setEditName(mgr.name);
    setEditEmail(mgr.email);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingManager && editName && editEmail) {
      await updateManager(editingManager.invite_id, editName, editEmail);
      setEditingManager(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Are you sure you want to remove ${name} from your team?`)) {
      await deleteManager(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#EFF6F7' }}>
      {/* Header */}
      <header className="chooser-header container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px', width: '100%' }}>
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
          className="logo"
          style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D568D', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
        >
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#D47700' }} />
          GigsForGigs
        </a>
      </header>

      <main className="chooser-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <h1 className="chooser-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: '#0D568D', marginBottom: '8px', fontWeight: 800 }}>
          Team Profile Switcher & Manager Supervision
        </h1>
        <p style={{ color: '#76594F', fontSize: '1.05rem', marginBottom: '40px', textAlign: 'center', maxWidth: '600px' }}>
          Select a manager profile to switch to their workspace dashboard, or manage team manager seats below.
        </p>
        
        {managers.length === 0 && (
          <p id="first-time-profile-note" style={{ textAlign: 'center', color: '#76594F', marginBottom: '24px' }}>
            No active manager seats yet. Click "Add Manager" below to invite your first manager.
          </p>
        )}

        <div className="profile-grid" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
          
          {/* Admin Profile */}
          <button
            onClick={() => handleProfileSelect('CLIENT', 'aditya@gigsforgigs.com', 'Aditya')}
            className="profile-avatar-btn"
            type="button"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="avatar-square" style={{ width: '120px', height: '120px', borderRadius: '16px', backgroundColor: '#0D568D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
              <span className="avatar-name" style={{ fontSize: '1.125rem', color: '#1A202C', fontWeight: 700 }}>Aditya</span>
              <span className="avatar-role" style={{ fontSize: '0.85rem', color: '#76594F', fontWeight: 600 }}>Client Owner</span>
            </div>
          </button>

          {/* Managers List */}
          {managers.map(mgr => (
            <div
              key={mgr.invite_id}
              className="manager-profile-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                width: '160px',
                backgroundColor: '#FFFFFF',
                padding: '16px 12px',
                borderRadius: '16px',
                border: '1px solid #D9E0E3',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => handleProfileSelect('MANAGER', mgr.email, mgr.name)}
                className="profile-avatar-btn"
                type="button"
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  className="avatar-square"
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '16px',
                    backgroundColor: '#D47700',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.25rem',
                    fontWeight: 800
                  }}
                >
                  {mgr.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                  <span className="avatar-name" style={{ fontSize: '1rem', color: '#1A202C', fontWeight: 700, textAlign: 'center', wordBreak: 'break-word' }}>
                    {mgr.name}
                  </span>
                  <span className="avatar-role" style={{ fontSize: '0.78rem', color: '#76594F', fontWeight: 600, marginTop: '2px' }}>
                    Manager
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#A0AEC0', marginTop: '2px' }}>
                    {mgr.email}
                  </span>
                </div>
              </button>

              {/* Action Buttons: Edit & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={(e) => handleStartEdit(e, mgr)}
                  title="Update manager details"
                  type="button"
                  style={{
                    border: 'none',
                    backgroundColor: '#EFF6FC',
                    color: '#0D568D',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => handleDelete(e, mgr.invite_id, mgr.name)}
                  title="Remove manager"
                  type="button"
                  style={{
                    border: 'none',
                    backgroundColor: '#FDE8E8',
                    color: '#C94C4C',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}

          {/* Add Manager Button */}
          <button
            onClick={() => onNavigate('add-manager')}
            className="profile-avatar-btn add-profile-btn"
            type="button"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div
              className="avatar-square"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '16px',
                border: '2px dashed #0D568D',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: '#0D568D'
              }}
            >
              +
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
              <span className="avatar-name" style={{ fontSize: '1.125rem', color: '#0D568D', fontWeight: 700 }}>
                Add Manager
              </span>
              <span style={{ fontSize: '0.8rem', color: '#76594F' }}>Invite Team Member</span>
            </div>
          </button>

        </div>
      </main>

      {/* Modal for Editing Manager */}
      {editingManager && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0D568D', marginTop: 0, marginBottom: '16px' }}>
              Update Manager Details
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                  Manager Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5DDE0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                  Manager Email *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5DDE0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingManager(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #D5DDE0', backgroundColor: '#FFFFFF', color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0D568D', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '0.85rem', color: '#76594F' }}>
        © 2026 GigsForGigs. All Rights Reserved.
      </footer>
    </div>
  );
};

export default ClientProfileSelection;
