import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

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
      <PageHeader title="My Manager Profile" description="View and update your manager account credentials." />

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
      <Card padding="lg">
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
          <Input label="Full Name" type="text" required value={name} onChange={e => setName(e.target.value)} />
          <Input label="Email Address" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="New Password (leave blank to keep current)" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            {loading ? 'Updating...' : 'Save Profile Changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ManagerProfile;
