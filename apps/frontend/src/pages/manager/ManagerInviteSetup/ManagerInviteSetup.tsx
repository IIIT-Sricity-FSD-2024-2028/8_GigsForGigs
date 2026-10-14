import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { authApi } from '../../../services/api/auth/authApi';
import { ApiError } from '../../../services/api/httpClient';

export interface ManagerInviteSetupProps {
  token: string;
  /** Called after activation (signed in) or when the user leaves the flow. */
  onDone: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #D5DDE0',
  fontSize: '15px',
  color: '#2D3748',
  backgroundColor: '#EFF6FC',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '8px' };

/** Activation page for the one-time link a client shares with an invited manager. */
export const ManagerInviteSetup: React.FC<ManagerInviteSetupProps> = ({ token, onDone }) => {
  const { acceptManagerInvite, loading, authError } = useAuth();
  const [invite, setInvite] = useState<{ name: string; email: string; clientName: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authApi
      .getManagerInvite(token)
      .then((data) => active && setInvite(data))
      .catch((err) => active && setLoadError(err instanceof ApiError ? err.message : 'This invite link could not be verified.'));
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    if (await acceptManagerInvite(token, password)) onDone();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6F7', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #D9E0E3' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0D568D', marginBottom: '8px' }}>Activate your manager account</h1>

        {!invite && !loadError && <p style={{ color: '#76594F' }}>Verifying your invite…</p>}

        {loadError && (
          <>
            <p role="alert" style={{ color: '#9B1C1C', backgroundColor: '#FDE8E8', padding: '12px', borderRadius: '8px' }}>{loadError}</p>
            <button type="button" onClick={onDone} className="btn btn-outline" style={{ marginTop: '16px', width: '100%' }}>
              Go to sign in
            </button>
          </>
        )}

        {invite && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <p style={{ color: '#76594F', margin: 0 }}>
              <strong>{invite.clientName}</strong> invited <strong>{invite.name}</strong> ({invite.email}) to manage their gigs. Choose a password to finish.
            </p>
            <div>
              <label style={labelStyle} htmlFor="mgr-password">Password</label>
              <input id="mgr-password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="mgr-confirm">Confirm password</label>
              <input maxLength={72} id="mgr-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
            </div>
            {(formError || authError) && (
              <p role="alert" style={{ color: '#9B1C1C', margin: 0 }}>{formError || authError}</p>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', border: 'none' }}>
              {loading ? 'Activating…' : 'Activate account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManagerInviteSetup;
