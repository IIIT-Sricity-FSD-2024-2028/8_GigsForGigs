import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

export const ManagerProfile: React.FC = () => {
  const { profile, updateProfile, loading } = useManager();

  const [name, setName] = useState(profile?.user?.name || 'Leo Hudson');
  const [email, setEmail] = useState(profile?.user?.email || 'leo.hudson@gigsforgigs.com');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const success = await updateProfile({
      name,
      email,
      ...(password ? { password } : {})
    });
    if (success) {
      setMsg({ type: 'success', text: 'Profile credentials updated successfully.' });
      setPassword('');
    } else {
      setMsg({ type: 'error', text: 'Failed to update profile credentials.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
      <div>
        <h1 style={{ fontSize: '28px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
          My Manager Profile
        </h1>
        <p style={{ color: '#76594F', fontSize: '15px', marginTop: '6px', margin: 0 }}>
          View and update your manager account credentials.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: msg.type === 'success' ? '#E4F2EF' : '#F8E8E8',
            color: msg.type === 'success' ? '#438F82' : '#C94C4C'
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Account Info Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #D9E0E3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#D47700',
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MH'}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>{name}</h2>
            <div style={{ fontSize: '13px', color: '#76594F', marginTop: '2px' }}>
              Associated Client: <strong>{profile?.client?.clientName || 'TechCorp Solutions'}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #D5DDE0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #D5DDE0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3A1F16', marginBottom: '6px' }}>
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #D5DDE0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#0D568D',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              marginTop: '8px'
            }}
          >
            {loading ? 'Updating...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerProfile;
