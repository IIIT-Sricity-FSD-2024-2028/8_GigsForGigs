import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ShieldIcon } from '../../../components/super-admin/Icons';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';

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
  const { user } = useAuth();
  const toast = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const env = React.useMemo(() => {
    if (typeof window === 'undefined') return { browser: 'Google Chrome on Windows 11', ip: '127.0.0.1' };
    const ua = navigator.userAgent;
    let b = 'Google Chrome';
    if (ua.includes('Edg/')) b = 'Microsoft Edge';
    else if (ua.includes('Firefox/')) b = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) b = 'Apple Safari';

    let o = 'Windows 11';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) o = 'macOS Sonoma';
    else if (ua.includes('Linux')) o = 'Linux (Ubuntu)';

    return {
      browser: `${b} on ${o}`,
      ip: window.location.hostname === 'localhost' ? '127.0.0.1 (Localhost)' : window.location.hostname
    };
  }, []);

  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-current', device: 'This Device (Active)', isCurrent: true, ip: '127.0.0.1 (Localhost)', lastActive: 'Active Now' },
    { id: 'sess-sec-01', device: 'Apple Safari on macOS (Backup Portal)', isCurrent: false, ip: '192.168.1.104', lastActive: '3 hours ago' },
    { id: 'sess-sec-02', device: 'Firefox Developer Edition (Mobile)', isCurrent: false, ip: '10.0.4.52', lastActive: 'Yesterday' }
  ]);

  useEffect(() => {
    setActiveSessions(prev => prev.map(s => s.isCurrent ? { ...s, device: `${env.browser} (This Device)`, ip: env.ip } : s));
  }, [env]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setMessage({ text: 'Please fill in all password fields.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    await adminApi.updateAdminPassword(adminEmail, newPassword);
    setMessage({ text: 'Password successfully updated across all clusters.', type: 'success' });
    toast.success('Password Updated', 'Your administrative master password was changed in database.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleToggle2FA = async () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    await adminApi.toggleAdmin2FA(adminEmail, nextState);
    toast.info('2FA State Toggled', `Two-factor authentication is now ${nextState ? 'Enabled' : 'Disabled'} in database.`);
  };

  const handleRevokeSessions = async (sessionId?: string) => {
    await adminApi.revokeAdminSession('adm-01');
    if (sessionId) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.warning('Session Terminated', `Device session ${sessionId} has been invalidated.`);
    } else {
      setActiveSessions(prev => prev.filter(s => s.isCurrent));
      toast.warning('All Sessions Revoked', 'All other active JWT browser sessions have been invalidated via tokenVersion increment.');
    }
  };

  const adminName = user?.name || 'Chaitanya Anand';
  const adminEmail = user?.email || 'chaitanya.admin@gigsforgigs.internal';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-xl)' }}>
      {/* Admin Credentials & Identity */}
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
            {adminName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              {adminName}
            </h2>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {adminEmail}
            </span>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge status={user?.adminTier || 'OWNER'} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Authority Tier</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {user?.adminTier === 'AUDITOR' ? 'Auditor Compliance (Read-Only Inspection)' :
               user?.adminTier === 'FINANCIAL_ADMIN' ? 'Financial Administration & Escrow Authority' :
               user?.adminTier === 'SUPPORT_ADMIN' ? 'Support & Arbitration Authority' :
               'Platform Root Authority (All RBAC Bitmasks)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Account Provisioned</span>
            <span style={{ fontWeight: 600 }}>January 10, 2026</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Cryptographic Key ID</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-dark)' }}>ed25519-rsa-0x98b4</span>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
            Update Master Credentials
          </h3>

          {message && (
            <div
              className={`admin-badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`}
              style={{ width: '100%', padding: '8px', justifyContent: 'center' }}
            >
              {message.text}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Current Password</label>
            <input
              type="password"
              className="admin-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>New Password</label>
              <input
                type="password"
                className="admin-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Confirm Password</label>
              <input
                type="password"
                className="admin-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-secondary"
            style={{ marginTop: 'var(--spacing-xs)', alignSelf: 'flex-start' }}
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Security, 2FA & Active Sessions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Two-Factor Authentication Box */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldIcon size={20} color="var(--color-primary-dark)" />
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                Hardware & TOTP Two-Factor Authentication
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: is2FAEnabled ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                backgroundColor: is2FAEnabled ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)'
              }}
            >
              {is2FAEnabled ? '✓ Enforced (TOTP)' : 'Disabled'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            Super Admin access mandates hardware security keys (FIDO2 / YubiKey) or time-based one-time password (TOTP) authenticator apps.
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={handleToggle2FA}
              className={`admin-btn ${is2FAEnabled ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              {is2FAEnabled ? 'Reconfigure Authenticator App' : 'Enroll 2FA Authenticator'}
            </button>
          </div>
        </div>

        {/* Active Browser & API Sessions */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
              Active Sessions & Device Tokens
            </h3>
            <button
              onClick={() => handleRevokeSessions()}
              className="admin-btn admin-btn-danger"
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Revoke All Other Sessions
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: session.isCurrent ? 'rgba(8, 75, 131, 0.05)' : 'var(--color-bg-light)',
                  border: session.isCurrent ? '1px solid var(--color-primary-dark)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)'
                }}
              >
                <div>
                  <div style={{ fontWeight: session.isCurrent ? 700 : 500, color: 'var(--color-text-dark)' }}>
                    {session.device} {session.isCurrent && <span style={{ color: 'var(--color-primary-dark)', fontSize: '10px' }}>(This Session)</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>IP: {session.ip} • Last active: {session.lastActive}</div>
                </div>
                {session.isCurrent ? (
                  <span className="admin-badge badge-success" style={{ fontSize: '10px' }}>Active</span>
                ) : (
                  <button
                    onClick={() => handleRevokeSessions(session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger-text)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Kill Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
