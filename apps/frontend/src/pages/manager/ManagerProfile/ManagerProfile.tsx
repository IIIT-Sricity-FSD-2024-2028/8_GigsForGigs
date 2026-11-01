import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';
import type { UpdateManagerProfileDto } from '../../../types/manager';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export interface ManagerProfileAccount {
  user: { name: string; email: string };
  client?: { clientName: string };
}

interface ManagerProfileFieldsProps {
  profile: ManagerProfileAccount | null;
  title?: string;
  description?: string;
  loading: boolean;
  allowPasswordChange?: boolean;
  readOnly?: boolean;
  onSave: (values: UpdateManagerProfileDto) => Promise<boolean>;
}

/** Shared profile screen used by a manager and by a client viewing that manager's profile. */
export const ManagerProfileFields: React.FC<ManagerProfileFieldsProps> = ({
  profile,
  title = 'My Manager Profile',
  description = 'View and update your manager account credentials.',
  loading,
  allowPasswordChange = true,
  readOnly = false,
  onSave,
}) => {
  const [name, setName] = useState(profile?.user.name || '');
  const [email, setEmail] = useState(profile?.user.email || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const success = await onSave({ name, email, ...(allowPasswordChange && password ? { password } : {}) });
    if (success) {
      setMsg({ type: 'success', text: 'Profile credentials updated successfully.' });
      setPassword('');
    } else {
      setMsg({ type: 'error', text: 'Failed to update profile credentials.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px', width: '100%' }}>
      <PageHeader title={title} description={description} />

      {msg && (
        <div role={msg.type === 'error' ? 'alert' : 'status'} style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, backgroundColor: msg.type === 'success' ? '#E4F2EF' : '#F8E8E8', color: msg.type === 'success' ? '#2E6E62' : '#C94C4C' }}>
          {msg.text}
        </div>
      )}

      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div aria-hidden="true" style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#B45F00', color: '#FFFFFF', fontSize: '22px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'M'}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', color: '#0D568D', margin: 0, fontWeight: 700 }}>{name}</h2>
            <div style={{ fontSize: '13px', color: '#475764', marginTop: '2px' }}>
              Associated Client: <strong>{profile?.client?.clientName || 'Client'}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input maxLength={100} label="Full Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} readOnly={readOnly} />
          <Input maxLength={100} label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly={readOnly} />
          {allowPasswordChange && (
            <Input maxLength={72} label="New Password (leave blank to keep current)" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            {loading ? 'Updating...' : 'Save Profile Changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export const ManagerProfile: React.FC = () => {
  const { profile, updateProfile, loading } = useManager();
  const onSave = (values: UpdateManagerProfileDto) => updateProfile(values);

  return (
    <ManagerProfileFields
      key={profile?.user.userId ?? 'loading'}
      profile={profile}
      loading={loading}
      onSave={onSave}
    />
  );
};

export default ManagerProfile;
