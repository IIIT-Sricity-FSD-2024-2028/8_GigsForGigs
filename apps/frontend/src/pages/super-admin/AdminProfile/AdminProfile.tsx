import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ShieldIcon } from '../../../components/super-admin/Icons';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../components/super-admin/Toast';
import { adminApi } from '../../../services/api/admin/adminApi';
import { getToken, setToken } from '../../../services/api/httpClient';
import { decodeJwtPayload } from '../../../utils/helpers/jwt';

/**
 * @file AdminProfile.tsx
 * @description
 * Super Admin personal profile & security management.
 * Password change, real TOTP enrollment (a code from the app is checked by the
 * server before 2FA turns on), and revocation of all other sessions through a
 * tokenVersion bump. Everything shown is read from the database or the JWT.
 */

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [dbProfile, setDbProfile] = useState<{
    createdAt?: string;
    isTwoFactorEnabled?: boolean;
    status?: string;
    adminTier?: string;
  } | null>(null);

  const [is2FAEnabled, setIs2FAEnabled] = useState(
    (user as any)?.twoFactorEnabled ?? (user as any)?.isTwoFactorEnabled ?? false
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [totpInput, setTotpInput] = useState('');

  // Load authoritative profile data from the PostgreSQL database
  useEffect(() => {
    let mounted = true;
    adminApi.getAdminProfile()
      .then((res) => {
        if (!mounted || !res) return;
        setDbProfile(res);
        if (typeof res.isTwoFactorEnabled === 'boolean') {
          setIs2FAEnabled(res.isTwoFactorEnabled);
        }
      })
      .catch((err) => toast.error('Profile Unavailable', err?.message || 'Could not load your profile.'));
    return () => {
      mounted = false;
    };
  }, [user?.userId, toast]);

  const provisionedDate = dbProfile?.createdAt
    ? new Date(dbProfile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  // When this browser's session token was issued, read from the JWT itself.
  const issuedAtSeconds = decodeJwtPayload<{ iat?: number }>(getToken('admin') ?? '')?.iat;
  const sessionIssuedAt = issuedAtSeconds ? new Date(issuedAtSeconds * 1000).toLocaleString() : '—';

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
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    try {
      const res = await adminApi.updateAdminPassword(currentPassword, newPassword);
      setToken('admin', res.token); // other devices were signed out; keep this one
    } catch (err: any) {
      setMessage({ text: err?.message || 'Could not update password.', type: 'error' });
      return;
    }
    setMessage({ text: 'Password updated.', type: 'success' });
    toast.success('Password Updated', 'Your other devices have been signed out.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  /** Step 1: fetch a secret to add to an authenticator app. 2FA stays off until step 2 succeeds. */
  const handleStartEnrollment = async () => {
    try {
      setEnrollment(await adminApi.enrollAdmin2FA());
      setTotpInput('');
    } catch (err: any) {
      toast.error('Enrollment Failed', err?.message || 'Could not start 2FA enrollment.');
    }
  };

  /** Step 2 of enrollment, or turning 2FA off. Either way the server checks a live code. */
  const handleSubmitCode = async () => {
    try {
      if (is2FAEnabled) await adminApi.disableAdmin2FA(totpInput);
      else await adminApi.confirmAdmin2FA(totpInput);
      setIs2FAEnabled(!is2FAEnabled);
      setEnrollment(null);
      setTotpInput('');
      toast.success('2FA Updated', is2FAEnabled ? 'Two-factor authentication is off.' : 'You will be asked for a code at your next login.');
    } catch (err: any) {
      toast.error('Invalid Code', err?.message || 'That code was not accepted.');
    }
  };

  /** Bumps tokenVersion, ending every session, then stores the fresh token so this browser stays in. */
  const handleRevokeSessions = async () => {
    if (!user?.userId) return;
    try {
      const res = await adminApi.revokeAdminSession(`adm-${user.userId}`);
      if (res.token) setToken('admin', res.token);
      toast.success('Other Sessions Ended', 'Every other device must sign in again.');
    } catch (err: any) {
      toast.error('Revocation Failed', err?.message || 'Could not revoke sessions.');
    }
  };

  const adminName = user?.name || 'Admin';
  const adminEmail = user?.email || '';
  const effectiveTier = dbProfile?.adminTier || user?.adminTier || '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 'var(--spacing-xl)' }}>
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
              <StatusBadge status={effectiveTier} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Authority Tier</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {effectiveTier === 'AUDITOR' ? 'Auditor Compliance (Read-Only Inspection)' :
               effectiveTier === 'FINANCIAL_ADMIN' ? 'Financial Administration & Escrow Authority' :
               effectiveTier === 'SUPPORT_ADMIN' ? 'Support & Arbitration Authority' :
               effectiveTier === 'CONTENT_MODERATOR' ? 'Content Moderation Authority' :
               effectiveTier === 'SUPER_ADMIN' ? 'Full Governance Authority' :
               effectiveTier === 'OWNER' ? 'Platform Owner (All Permissions)' : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Account Provisioned</span>
            <span style={{ fontWeight: 600 }}>{provisionedDate}</span>
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
                Two-Factor Authentication (TOTP)
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
              {is2FAEnabled ? '✓ Enabled' : 'Disabled'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            When enabled, login needs a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password) as well as your password.
          </p>

          {!is2FAEnabled && !enrollment && (
            <div>
              <button onClick={handleStartEnrollment} className="admin-btn admin-btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Enroll Authenticator App
              </button>
            </div>
          )}

          {enrollment && (
            <div style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)' }}>
              <div>1. In your app, add an account using this setup key:</div>
              <code style={{ display: 'block', margin: '6px 0', fontWeight: 700, wordBreak: 'break-all' }}>{enrollment.secret}</code>
              <div>
                On a phone, you can <a href={enrollment.otpauthUri}>open it directly</a>. 2. Enter the code it shows below.
              </div>
            </div>
          )}

          {(is2FAEnabled || enrollment) && (
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
              <input
                className="admin-input"
                aria-label="Authenticator code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                style={{ maxWidth: '120px' }}
              />
              <button
                onClick={handleSubmitCode}
                disabled={totpInput.length !== 6}
                className={`admin-btn ${is2FAEnabled ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                {is2FAEnabled ? 'Disable 2FA' : 'Confirm & Enable'}
              </button>
            </div>
          )}
        </div>

        {/* Active Browser & API Sessions */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
              Sessions
            </h3>
            <button
              onClick={handleRevokeSessions}
              className="admin-btn admin-btn-danger"
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Sign Out All Other Devices
            </button>
          </div>

          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(8, 75, 131, 0.05)',
              border: '1px solid var(--color-primary-dark)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>This browser</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Session issued: {sessionIssuedAt}</div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
            Sessions are stateless tokens, so the server keeps no per-device list. Signing out other devices invalidates every token issued before now.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
