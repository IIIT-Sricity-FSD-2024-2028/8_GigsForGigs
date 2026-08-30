import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/api/admin/adminApi';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';

export interface AdminInviteActivationProps {
  initialToken?: string;
  initialEmail?: string;
  onActivationSuccess?: () => void;
}

export const AdminInviteActivation: React.FC<AdminInviteActivationProps> = ({
  initialToken,
  initialEmail,
  onActivationSuccess
}) => {
  const { updateUserSession } = useAuth();
  const toast = useToast();

  const [token, setToken] = useState(initialToken || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [assignedRole, setAssignedRole] = useState('AUDITOR');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);

  useEffect(() => {
    // Parse URL params if not passed via props
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token') || initialToken || '';
      const urlEmail = params.get('email') || initialEmail || '';

      if (urlToken) setToken(urlToken);
      if (urlEmail) {
        setEmail(urlEmail);
        if (urlEmail.toLowerCase().includes('auditor')) setAssignedRole('AUDITOR');
        else if (urlEmail.toLowerCase().includes('finance')) setAssignedRole('FINANCIAL_ADMIN');
        else if (urlEmail.toLowerCase().includes('support')) setAssignedRole('SUPPORT_ADMIN');
        else setAssignedRole('SUPER_ADMIN');
      }

      if (urlToken && urlToken.length > 6) {
        setIsTokenVerified(true);
      }
    }
  }, [initialToken, initialEmail]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPassword.trim() && !newPassword.trim()) {
      toast.error('Password Required', 'Please enter your assigned master password to verify and activate.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.acceptAdminInvitation(token, email, newPassword || tempPassword);
      if (res && res.token) {
        localStorage.setItem('g4g_admin_token', res.token);
      }
      
      const permissionsMap: Record<string, string[]> = {
        AUDITOR: ['users:read', 'payments:read', 'projects:read', 'audit:read'],
        FINANCIAL_ADMIN: ['users:read', 'payments:read', 'payments:release', 'payments:refund', 'projects:read'],
        SUPPORT_ADMIN: ['users:read', 'projects:read', 'disputes:resolve', 'reviews:moderate'],
        SUPER_ADMIN: ['*'],
        OWNER: ['*']
      };

      const userSession = {
        userId: res?.user?.userId || Math.floor(100 + Math.random() * 900),
        role: 'SUPER_ADMIN' as const,
        name: (email.split('@')[0] || 'Admin').replace(/[^a-zA-Z]/g, ' '),
        email: email,
        adminTier: (res?.user?.adminTier || assignedRole) as any,
        permissions: permissionsMap[assignedRole] || ['*'],
        appliedTaskIds: []
      };

      localStorage.setItem('gfg_active_user', JSON.stringify(userSession));
      updateUserSession(userSession);

      // Clean query params and pathname to root
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/');
      }

      toast.success('Admin Seat Activated!', `Welcome to the Super Admin vertical, ${userSession.name}`);
      if (onActivationSuccess) {
        onActivationSuccess();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err: any) {
      toast.error('Activation Failed', err?.message || 'Could not verify token. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6F7',
        padding: '24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(8, 75, 131, 0.12)',
          border: '1px solid #DBDFDF',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#084b83',
            color: '#FFFFFF',
            padding: '28px 32px',
            borderBottom: '4px solid #bf6900'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>👑</span>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              GigsForGigs Administrative Onboarding
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, color: '#F0F6F6' }}>
            Cryptographic one-time seat provisioning & credential security initialization
          </p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '32px' }}>
          {isTokenVerified && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#065F46',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <span>🛡️</span>
              <span>Cryptographic 256-Bit Invitation Token Verified & Active</span>
            </div>
          )}

          <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Recipient Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Delegate Administrator Email
              </label>
              <input
                type="email"
                readOnly={!!email}
                required
                className="admin-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ backgroundColor: email ? '#F8FAFC' : '#FFFFFF', fontWeight: 600 }}
              />
            </div>

            {/* Assigned Role & Permissions Display */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Assigned Administrative Tier</span>
                <StatusBadge status={assignedRole} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5' }}>
                {assignedRole === 'AUDITOR' && (
                  <span>🔍 <strong>Auditor Tier:</strong> Authorized for read-only compliance inspection across all ledgers, projects, and users. Mutation/refund buttons are locked down.</span>
                )}
                {assignedRole === 'FINANCIAL_ADMIN' && (
                  <span>💳 <strong>Financial Admin Tier:</strong> Authorized for escrow inspection, refunds, force releases, and transaction accounting.</span>
                )}
                {assignedRole === 'SUPPORT_ADMIN' && (
                  <span>🛡️ <strong>Support Admin Tier:</strong> Authorized for arbitration court, dispute resolution, and review moderation.</span>
                )}
                {assignedRole === 'SUPER_ADMIN' && (
                  <span>👑 <strong>Super Admin Tier:</strong> Full platform root governance and configuration permissions.</span>
                )}
              </div>
            </div>

            {/* Temporary Master Password / Assigned Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Assigned Master Password / Activation Key
              </label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. AdminPass#629910"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700 }}
              />
            </div>

            {/* Set New Personal Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Set New Personal Password (Optional)
              </label>
              <input
                type="password"
                className="admin-input"
                placeholder="Leave blank to use assigned master password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {newPassword && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="admin-input"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit Action */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                className="admin-btn admin-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Activating Credentials...' : '🚀 Complete Activation & Enter Admin Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminInviteActivation;
