import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { Card } from '../../../components/common/Card';
import { ManagerProfileFields } from '../../manager/ManagerProfile/ManagerProfile';
import type { UpdateManagerProfileDto } from '../../../types/manager';
import { Button } from '../../../components/common';

interface ManagerProfileViewProps {
  managerId: string;
  onBack: () => void;
}

export const ManagerProfileView: React.FC<ManagerProfileViewProps> = ({ managerId, onBack }) => {
  const { managers, updateManager, loading } = useClient();
  const manager = managers.find((item) => item.invite_id === managerId);

  const onSave = async ({ name, email }: UpdateManagerProfileDto) => {
    if (!manager || manager.kind !== 'manager' || !name || !email) return false;
    try {
      await updateManager(manager.invite_id, name, email);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', backgroundColor: '#F2F6F8' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Button variant="ghost" type="button" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          ← Back to Supervise Manager
        </Button>

        {loading && !manager ? <p role="status">Loading manager profile…</p> : !manager ? (
          <Card padding="lg">
            <h1 style={{ color: '#0D568D', marginTop: 0 }}>Manager not found</h1>
            <p style={{ color: '#475764' }}>This manager may have been removed from your team.</p>
          </Card>
        ) : manager.kind !== 'manager' ? (
          <Card padding="lg">
            <h1 style={{ color: '#0D568D', marginTop: 0 }}>{manager.name}'s Profile</h1>
            <p style={{ color: '#475764' }}>This manager has not accepted the invitation yet, so their profile is not available.</p>
            <p style={{ color: '#475764', marginBottom: 0 }}>Invite email: {manager.email}</p>
          </Card>
        ) : (
          <ManagerProfileFields
            key={manager.invite_id}
            profile={{
              user: { name: manager.name, email: manager.email },
              client: { clientName: manager.clientName || 'Client' },
            }}
            title={`${manager.name}'s Manager Profile`}
            description="View and update this manager's account profile."
            loading={loading}
            allowPasswordChange={false}
            onSave={onSave}
          />
        )}
      </div>
    </main>
  );
};

export default ManagerProfileView;
