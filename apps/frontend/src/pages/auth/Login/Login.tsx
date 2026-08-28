<<<<<<< HEAD
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
=======
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';
>>>>>>> origin/main

interface LoginProps {
  onBackToLanding?: () => void;
  onNavigateToSignup?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToLanding, onNavigateToSignup }) => {
<<<<<<< HEAD
  const { login, loading, authError } = useAuth();
  const [role, setRole] = useState<'CLIENT' | 'MANAGER' | 'GIG_PROFESSIONAL' | 'SUPER_ADMIN' | ''>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!role) {
      setErrorMsg('Please select your role.');
      return;
    }
    // Manager accounts authenticate through a separate backend endpoint
    // (/auth/manager/login); the role field otherwise just labels the form
    // — the actual role always comes back from the server's JWT.
    const success = await login(email, password, role);
    if (!success) {
      setErrorMsg(authError || 'Invalid login credentials or server error. Please try again.');
=======
  const { login, loading } = useAuth();
  const [role, setRole] = useState('super_admin');
  const [email, setEmail] = useState('chaitanya.admin@gigsforgigs.internal');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cryptographic Invitation Token Detection
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [assignedPassword, setAssignedPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    const em = params.get('email');
    if (token && em) {
      setInviteToken(token);
      setInviteEmail(em);
      setEmail(em);
      setRole('super_admin');
    }
  }, []);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole === 'super_admin') setEmail('chaitanya.admin@gigsforgigs.internal');
    else if (newRole === 'manager') setEmail('aditya@techstart.io');
    else if (newRole === 'client') setEmail('aditya@gigsforgigs.com');
    else if (newRole === 'freelancer') setEmail('elena.rodriguez@freelance.dev');
  };

  const handleQuickLogin = async (quickRole: string, quickEmail: string) => {
    setErrorMsg(null);
    await login(quickEmail, 'password123', quickRole);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken || !inviteEmail || !assignedPassword.trim()) {
      setErrorMsg('Please enter your assigned password to activate your seat.');
      return;
    }
    setErrorMsg(null);
    setIsActivating(true);
    try {
      const res = await adminApi.acceptAdminInvitation(inviteToken, inviteEmail, assignedPassword);
      if (res) {
        await login(inviteEmail, assignedPassword, 'SUPER_ADMIN');
      } else {
        setErrorMsg('Invalid or expired cryptographic token.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to accept invitation.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const success = await login(email, password, role);
      if (!success) {
        setErrorMsg('Invalid credentials or server error. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg('Invalid credentials or server error. Please try again.');
>>>>>>> origin/main
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#FFFFFF'
      }}
    >
      {/* LEFT SIDE - Hero & Illustration */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#0F527E',
          color: '#FFFFFF',
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Logo at Top Left */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={onBackToLanding}
        >
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#D47700' }} />
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            GigsForGigs
          </span>
        </div>

        {/* Hero Text Content */}
        <div style={{ maxWidth: '460px', marginTop: '60px', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px', letterSpacing: '-0.5px' }}>
            Connect with the world's best talent.
          </h1>
          <p style={{ fontSize: '18px', color: '#D0E3F0', lineHeight: 1.6, margin: 0 }}>
            Join thousands of startups and freelancers collaborating on the next generation of digital products.
          </p>
        </div>

        {/* Stylized Bar Illustration at Bottom */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', height: '180px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#A4C4D9', border: '3px solid #0F527E' }} />
            <div style={{ width: '64px', height: '110px', backgroundColor: '#6B5B3E', borderRadius: '12px 12px 0 0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C87D20', border: '3px solid #0F527E' }} />
            <div style={{ width: '64px', height: '150px', backgroundColor: '#5281A5', borderRadius: '12px 12px 0 0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '64px', height: '90px', backgroundColor: '#426987', borderRadius: '12px 12px 0 0' }} />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          padding: '64px 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* Back Link to Landing */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            style={{
              position: 'absolute',
              top: '32px',
              right: '48px',
              background: 'none',
              border: 'none',
              color: '#718096',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to Home
          </button>
        )}

        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F527E', margin: '0 0 8px 0' }}>
              Welcome back to GigsForGigs
            </h2>
            <p style={{ fontSize: '15px', color: '#8C6A5E', margin: 0 }}>
              Please enter your details to sign in.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: '#FDE8E8',
                color: '#9B1C1C',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                fontWeight: 600
              }}
            >
              {errorMsg}
            </div>
          )}

<<<<<<< HEAD
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Log in as Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                Log in as
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D5DDE0',
                  fontSize: '15px',
                  color: '#2D3748',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select your role</option>
                <option value="CLIENT">Client</option>
                <option value="MANAGER">Manager</option>
                <option value="GIG_PROFESSIONAL">Gig Professional</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
=======
          {inviteToken ? (
            <form onSubmit={handleAcceptInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#E6F4EA', border: '1px solid #CEEAD6', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, color: '#137333', fontSize: '15px' }}>👑 Delegate Super Admin Invitation</div>
                <div style={{ fontSize: '13px', color: '#3C4043', marginTop: '4px' }}>
                  A cryptographic invitation token has been verified for <strong>{inviteEmail}</strong>.
                </div>
              </div>
>>>>>>> origin/main

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                  Invited Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  value={inviteEmail || ''}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D5DDE0',
                    backgroundColor: '#F8F9FA',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#084b83'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                  Enter Assigned Master Password (from Owner)
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. Admin#123456"
                  value={assignedPassword}
                  onChange={(e) => setAssignedPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D5DDE0',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isActivating || loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0F527E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isActivating ? 'Activating Seat...' : '✓ Activate Admin Seat & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname);
                  setInviteToken(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8C6A5E',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel and return to standard login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Log in as Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                  Log in as
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D5DDE0',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#0F527E',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="super_admin">👑 Super Administrator</option>
                  <option value="manager">👔 Project Manager</option>
                  <option value="client">💼 Client / Organization</option>
                  <option value="freelancer">⚡ Gig Professional</option>
                </select>
              </div>

              {/* Email Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D5DDE0',
                    fontSize: '15px',
                    color: '#2C3E50',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D5DDE0',
                    fontSize: '15px',
                    color: '#2C3E50',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Remember me & Forgot Password */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#5C443A' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ borderRadius: '4px', accentColor: '#0F527E' }}
                  />
                  Remember me
                </label>
                <a href="#forgot" style={{ color: '#D47700', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </a>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0F527E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '13px', color: '#9AA7AF' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Google SSO Button */}
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5DDE0',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              color: '#2C3E50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z" />
              <path fill="#FBBC05" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.3-1.78L.97 4.96A8.98 8.98 0 0 0 0 9c0 1.45.35 2.82.97 4.04l2.91-2.26z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.96l2.91 2.26C4.6 5.05 6.62 3.58 9 3.58z" />
            </svg>
            Google
          </button>

          {/* Quick Demo Role Selector */}
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '10px', backgroundColor: '#EFF6FC', border: '1px solid #D5DDE0' }}>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F527E', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
              ⚡ 1-Click Instant Evaluation Demo:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('super_admin', 'chaitanya.admin@gigsforgigs.internal')}
                style={{ padding: '8px 10px', backgroundColor: '#084b83', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'aditya@techstart.io')}
                style={{ padding: '8px 10px', backgroundColor: '#0D568D', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                👔 Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('client', 'aditya@gigsforgigs.com')}
                style={{ padding: '8px 10px', backgroundColor: '#137333', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                💼 Client
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('freelancer', 'elena.rodriguez@freelance.dev')}
                style={{ padding: '8px 10px', backgroundColor: '#bf6900', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                ⚡ Gig Pro
              </button>
            </div>
          </div>

          {/* Footer prompt */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#5C443A' }}>
            Don't have an account?{' '}
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToSignup) onNavigateToSignup();
              }}
              style={{ color: '#D47700', fontWeight: 700, textDecoration: 'none' }}
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
