import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

interface LoginProps {
  onBackToLanding?: () => void;
  onNavigateToSignup?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToLanding, onNavigateToSignup }) => {
  const { login, loading } = useAuth();
  const [role, setRole] = useState<'CLIENT' | 'MANAGER' | 'GIG_PROFESSIONAL' | 'SUPER_ADMIN' | ''>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    const success = await login(email, password, role || undefined);
    if (!success) {
      setErrorMsg('Invalid email or password. Please verify your credentials.');
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Log in as Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                Log in as
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Super Admin' || val === 'SUPER_ADMIN') setRole('SUPER_ADMIN');
                  else if (val === 'Manager' || val === 'MANAGER') setRole('MANAGER');
                  else if (val === 'Client' || val === 'CLIENT') setRole('CLIENT');
                  else if (val === 'Gig Professional' || val === 'GIG_PROFESSIONAL') setRole('GIG_PROFESSIONAL');
                  else setRole(val as any);
                }}
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

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditya@techstart.io"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D5DDE0',
                  fontSize: '15px',
                  color: '#2D3748',
                  backgroundColor: '#EFF6FC',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D5DDE0',
                  fontSize: '15px',
                  color: '#2D3748',
                  backgroundColor: '#EFF6FC',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Options line: Remember me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C443A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                />
                Remember me
              </label>
              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                style={{ color: '#D47700', textDecoration: 'none', fontWeight: 600 }}
              >
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

          {/* Footer prompt */}
          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#5C443A' }}>
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
