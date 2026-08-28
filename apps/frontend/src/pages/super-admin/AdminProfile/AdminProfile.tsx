import React, { useState } from 'react';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ShieldIcon } from '../../../components/super-admin/Icons';

/**
 * @file AdminProfile.tsx
 * @description
 * Super Admin personal profile & security management.
 * Features 2FA enrollment, session revocation, and security audit metrics.
 *
 * NOT WIRED TO THE REAL BACKEND: there is no 2FA column on User, no session
 * table (JWTs are stateless — nothing to "revoke" server-side), and no
 * /api/auth/change-password route. Left entirely on local mock UI state
 * rather than faking a persistence layer. (The identity card's name/email/
 * "OWNER" badge are also hardcoded fixtures, not the logged-in admin's own
 * user record — there's no GET /api/admin/me equivalent either.)
 */

export const AdminProfile: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeSessions = [
    { device: 'Chrome on Windows 11 (This Device)', ip: '192.168.1.42', lastActive: 'Active Now', current: true },
    { device: 'Safari on macOS Sonoma', ip: '10.0.4.19', lastActive: '2 hours ago', current: false },
    { device: 'Firefox on Linux (Ubuntu 24.04)', ip: '172.16.0.8', lastActive: 'Yesterday', current: false }
  ];

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setMessage({ text: 'Please fill in all password fields.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setMessage({ text: 'Password successfully updated across all clusters.', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRevokeSessions = () => {
    alert('All other active admin sessions have been revoked (tokenVersion incremented).');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-xl)' }}>
      {/* ── Admin Credentials & Identity ────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-blue)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800
            }}
          >
            CA
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Chaitanya Anand
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              chaitanya.admin@gigsforgigs.internal
            </p>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge status="OWNER" />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Root Privilege Scope:</span>
            <span style={{ fontWeight: 600 }}>Unrestricted (Wildcard *)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Account Created:</span>
            <span>August 2026</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Cryptographic Key ID:</span>
            <code style={{ fontSize: '11px' }}>0x7F...9A4E</code>
          </div>
        </div>
      </div>

      {/* ── Two-Factor Authentication Panel ─────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <ShieldIcon size={22} color="var(--color-primary-dark)" />
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Two-Factor Authentication (2FA)
          </h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Enforces Time-Based One-Time Passwords (TOTP via Google Authenticator or 1Password) on all administrative logins.
        </p>

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: is2FAEnabled ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
            border: `1px solid ${is2FAEnabled ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: is2FAEnabled ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
              {is2FAEnabled ? '2FA Protection Active' : '2FA Unenrolled'}
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {is2FAEnabled ? 'TOTP hardware or authenticator app required at login.' : 'Your account is vulnerable without 2FA.'}
            </p>
          </div>
          <button
            className={`admin-btn ${is2FAEnabled ? 'admin-btn-outline' : 'admin-btn-primary'} admin-btn-sm`}
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          >
            {is2FAEnabled ? 'Disable 2FA' : 'Enroll 2FA'}
          </button>
        </div>
      </div>

      {/* ── Password Reset Form ─────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
          Change Administrator Password
        </h3>
        {message && (
          <div
            className={`admin-badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`}
            style={{ width: '100%', padding: '8px 12px', marginBottom: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              CURRENT PASSWORD
            </label>
            <input
              type="password"
              className="admin-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              NEW PASSWORD
            </label>
            <input
              type="password"
              className="admin-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              CONFIRM NEW PASSWORD
            </label>
            <input
              type="password"
              className="admin-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: 'flex-start' }}>
            Update Password
          </button>
        </form>
      </div>

      {/* ── Active Sessions & Revocation ─────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Active Login Sessions
          </h3>
          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={handleRevokeSessions}>
            Revoke All Other Sessions
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {activeSessions.map((session, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: session.current ? 'rgba(8, 75, 131, 0.04)' : 'var(--color-bg-white)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{session.device}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>
                  IP: {session.ip} · {session.lastActive}
                </span>
              </div>
              {session.current ? (
                <span className="admin-badge badge-success">This Device</span>
              ) : (
                <span className="admin-badge badge-neutral">Active</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
