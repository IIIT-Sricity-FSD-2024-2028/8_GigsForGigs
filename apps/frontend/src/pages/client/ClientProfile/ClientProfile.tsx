/**
 * @file ClientProfile.tsx
 * @description
 * Client organization profile page.
 * Displays and allows updating client company details, domain/industry,
 * and shows associated user account information and supervised manager counts.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import clientApi, { type ClientProfileData } from '../../../services/api/client/clientApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Loader } from '../../../components/common/Loader';

export interface ClientProfileProps {
  onNavigate?: (viewId: string) => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = () => {
  const { user, updateUserSession } = useAuth();
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [clientName, setClientName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientApi.getProfile();
      setProfile(data);
      setClientName(data.clientName || '');
      setDomain(data.domain || '');
      setMsg(null);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load client profile.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = clientName.trim();
    if (!cleanName) {
      setMsg({ type: 'error', text: 'Company name is required.' });
      return;
    }

    try {
      setIsSaving(true);
      setMsg(null);
      const updated = await clientApi.updateProfile({
        clientName: cleanName,
        domain: domain.trim() || undefined,
      });
      setProfile(updated);
      setClientName(updated.clientName);
      setDomain(updated.domain || '');
      updateUserSession({ name: updated.clientName });
      setMsg({ type: 'success', text: 'Client profile updated successfully!' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loader label="Loading client profile..." />;
  }

  const initials = (clientName || user?.name || 'Client')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <PageHeader
        title="Client Profile"
        description="View and update your company organization profile and account credentials."
      />

      {msg && (
        <div
          role={msg.type === 'error' ? 'alert' : 'status'}
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: msg.type === 'success' ? '#DEF7EC' : '#FDE8E8',
            color: msg.type === 'success' ? '#03543F' : '#9B1C1C',
            border: msg.type === 'success' ? '1px solid #BCF0DA' : '1px solid #F8B4B4',
          }}
        >
          <span>{msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}</span>
          <button
            type="button"
            onClick={() => setMsg(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Account Info Card */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-blue)',
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700, wordBreak: 'break-word' }}>
              {clientName || user?.name || 'Client Account'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Primary Contact: <strong>{profile?.user?.name || user?.name}</strong> • {profile?.user?.email || user?.email}
            </div>
            {profile?.numberOfManager !== undefined && (
              <div style={{ fontSize: '12px', color: '#0D568D', marginTop: '4px', fontWeight: 600 }}>
                Supervised Managers: {profile.numberOfManager} active
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            id="client-name-input"
            maxLength={100}
            label="Organization / Company Name"
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            helperText="The display name shown on your posted tasks and contracts."
          />

          <Input
            id="client-domain-input"
            maxLength={100}
            label="Industry / Domain"
            type="text"
            placeholder="e.g. Fintech, Healthcare, SaaS, E-Commerce"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            helperText="Your organization's primary operating industry or specialization."
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                if (profile) {
                  setClientName(profile.clientName || '');
                  setDomain(profile.domain || '');
                  setMsg(null);
                }
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ClientProfile;
