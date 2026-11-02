import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { authApi } from '../../../services/api/auth/authApi';
import { ApiError } from '../../../services/api/httpClient';
import { Button, Input } from '../../../components/common';

export interface ManagerInviteSetupProps {
  token: string;
  /** Called after activation (signed in) or when the user leaves the flow. */
  onDone: () => void;
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#1B2A36', marginBottom: '8px' };

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F6F8', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #DCE3E8' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0D568D', marginBottom: '8px' }}>Activate your manager account</h1>

        {!invite && !loadError && <p style={{ color: '#475764' }}>Verifying your invite…</p>}

        {loadError && (
          <>
            <p role="alert" style={{ color: '#9B1C1C', backgroundColor: '#FDE8E8', padding: '12px', borderRadius: '8px' }}>{loadError}</p>
            <Button variant="outline" type="button" onClick={onDone} style={{ marginTop: '16px', width: '100%' }}>
              Go to sign in
            </Button>
          </>
        )}

        {invite && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <p style={{ color: '#475764', margin: 0 }}>
              <strong>{invite.clientName}</strong> invited <strong>{invite.name}</strong> ({invite.email}) to manage their gigs. Choose a password to finish.
            </p>
            <div>
              <label style={labelStyle} htmlFor="mgr-password">Password</label>
              <Input id="mgr-password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="mgr-confirm">Confirm password</label>
              <Input maxLength={72} id="mgr-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {(formError || authError) && (
              <p role="alert" style={{ color: '#9B1C1C', margin: 0 }}>{formError || authError}</p>
            )}
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Activating…' : 'Activate account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManagerInviteSetup;
