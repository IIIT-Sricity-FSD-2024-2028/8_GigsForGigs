import React from 'react';
import { useClient } from '../../../context/ClientContext';
import { Card } from '../../../components/common/Card';
import { Loader } from '../../../components/common/Loader';
import { ManagerProfileFields } from '../../manager/ManagerProfile/ManagerProfile';
import type { UpdateManagerProfileDto } from '../../../types/manager';
import { Button } from '../../../components/common';
import { hiresFor } from '../../../utils/managerLoad';

interface ManagerProfileViewProps {
  managerId: string;
  onBack: () => void;
}

export const ManagerProfileView: React.FC<ManagerProfileViewProps> = ({ managerId, onBack }) => {
  const { managers, contracts, updateManager, loading } = useClient();
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

        {loading && !manager ? <Loader label="Loading manager profile..." /> : !manager ? (
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

        {manager?.kind === 'manager' && (
          <Card padding="lg">
            <h2 style={{ color: '#0D568D', marginTop: 0 }}>Assigned tasks ({hiresFor(contracts, manager.invite_id).length})</h2>
            {hiresFor(contracts, manager.invite_id).length === 0 ? (
              <p style={{ color: '#475764', margin: 0 }}>No tasks assigned yet. Assign this manager from My Gigs once a hire is funded.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hiresFor(contracts, manager.invite_id).map((c) => (
                  <li key={c.contract_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', border: '1px solid #DCE3E8', borderRadius: '10px' }}>
                    <span>
                      <strong>{c.task_title}</strong>
                      <br />
                      <span style={{ color: '#475764', fontSize: '0.85rem' }}>{c.gig_pro_name}</span>
                    </span>
                    <span style={{ color: '#475764', fontSize: '0.85rem', textAlign: 'right' }}>
                      {c.status === 'COMPLETED' ? 'Completed' : `${c.progress}% done`}
                      {c.has_open_dispute && <><br /><strong style={{ color: '#B42318' }}>Dispute open</strong></>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </main>
  );
};

export default ManagerProfileView;
