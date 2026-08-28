import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

interface SignupProps {
  onBackToLanding?: () => void;
  onNavigateToLogin?: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onBackToLanding, onNavigateToLogin }) => {
  const { signup, loading, authError } = useAuth();
  const [role, setRole] = useState<'CLIENT' | 'GIG_PROFESSIONAL' | ''>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!role) {
      setErrorMsg('Please select your role (Client or Gig Professional).');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      return;
    }

    const success = await signup(fullName, email, password, role);
    if (!success) {
      setErrorMsg(authError || 'Registration failed. Please try again.');
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
      {/* LEFT SIDE - Light Hero Section */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#F4F8FA',
          color: '#1A202C',
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
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#D47700', letterSpacing: '-0.5px' }}>
            GigsForGigs
          </span>
        </div>

        {/* Hero Text Content */}
        <div style={{ maxWidth: '440px', marginTop: '60px', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#0F527E', lineHeight: 1.2, marginBottom: '20px', letterSpacing: '-0.5px' }}>
            Empowering Global Creativity
          </h1>
          <p style={{ fontSize: '18px', color: '#8C6A5E', lineHeight: 1.6, margin: 0 }}>
            Join thousands of professionals finding their next big opportunity. Post tasks, find work, and collaborate globally.
          </p>
        </div>

        {/* Subtle Arc Graphic Illustration */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '180px', position: 'relative' }}>
          <div style={{ width: '220px', height: '220px', borderRadius: '50%', border: '2px dashed #0F527E', opacity: 0.2, position: 'absolute', bottom: '-80px' }} />
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#E2EEF5', opacity: 0.6, position: 'absolute', bottom: '-40px', left: '20%' }} />
        </div>
      </div>

      {/* RIGHT SIDE - Signup Form */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          padding: '48px 64px',
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F527E', margin: '0 0 6px 0' }}>
              Create your GigsForGigs account
            </h2>
            <p style={{ fontSize: '15px', color: '#8C6A5E', margin: 0 }}>
              Start your journey with us today.
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
                marginBottom: '16px',
                fontWeight: 600
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sign up as Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                Sign up as
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
                <option value="GIG_PROFESSIONAL">Gig Professional</option>
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
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
              />
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
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
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
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
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
              />
            </div>

            {/* Submit Create Account Button */}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '13px', color: '#9AA7AF' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#5C443A' }}>
            Already have an account?{' '}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToLogin) onNavigateToLogin();
              }}
              style={{ color: '#D47700', fontWeight: 700, textDecoration: 'none' }}
            >
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
