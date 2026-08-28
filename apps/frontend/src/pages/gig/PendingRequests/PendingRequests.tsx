/**
 * @file PendingRequests.tsx
 * @description
 * Incoming client requests management view.
 * Enables Gig Professionals to accept or decline task invitations from clients and managers.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { PendingRequest } from '../../../types/gig';

export const PendingRequests: React.FC = () => {
  const { refreshTrigger, triggerRefresh, setActiveTab } = useGig();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const res = await gigApi.getPendingRequests();
        if (mounted) {
          setRequests(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load pending requests.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const handleRespond = async (applicationId: string, action: 'accepted' | 'declined') => {
    setProcessingId(applicationId);
    setError(null);
    try {
      await gigApi.respondToRequest(applicationId, action);
      triggerRefresh();
      if (action === 'accepted') {
        setActiveTab('active-tasks');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed responding to request.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Pending Requests...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {error && (
        <div
          style={{
            backgroundColor: '#FDE8E8',
            color: '#9B1C1C',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      {/* Header Banner */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Pending Client Invitations
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Review task offers directly submitted to your profile. Accept offers to begin active development.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No pending client requests at this moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {requests.map((req) => {
            const isProcessing = processingId === req.application_id;

            return (
              <div
                key={req.application_id}
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-md)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                      {req.task?.title || 'Task Invitation'}
                    </h3>
                    <span className="admin-badge badge-warning">
                      {req.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                    Client: {req.task?.client_id || 'Client'}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {req.task?.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Offered Budget</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatCurrency(req.task?.budget || req.budget || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      disabled={isProcessing}
                      onClick={() => handleRespond(req.application_id, 'declined')}
                    >
                      Decline
                    </button>
                    <button
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      disabled={isProcessing}
                      onClick={() => handleRespond(req.application_id, 'accepted')}
                    >
                      Accept Offer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
