/**
 * @file ServiceRequests.tsx
 * @description
 * Incoming client requests for one specific posted service. Reached from the
 * "Client Requests" button on My Services. Accepting a request starts the
 * contract, which is picked up by Active Task.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGigNavigation } from '../../../hooks/useGigNavigation';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchServiceRequests, fetchServices, rejectionMessage, respondToRequest } from '../../../store/gig/gigSlice';
import { selectGigServices, selectServiceRequests } from '../../../store/gig/selectors';
import { Loader } from '../../../components/common/Loader';
import { Button, useToast } from '../../../components/common';

export const ServiceRequests: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const id = serviceId && Number.isSafeInteger(Number(serviceId)) ? Number(serviceId) : null;
  const { setActiveTab } = useGigNavigation();
  const dispatch = useAppDispatch();
  const servicesRes = useAppSelector(selectGigServices);
  const requestsRes = useAppSelector((state) => selectServiceRequests(state, id));
  const service = servicesRes.data.find((s) => s.serviceId === id) ?? null;
  const requests = requestsRes?.data ?? [];
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);
  const error = respondError ?? requestsRes?.error ?? servicesRes.error;
  const loading = !error && !(servicesRes.loaded && requestsRes?.loaded);
  const toast = useToast();
  useEffect(() => { if (error) toast.error(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void dispatch(fetchServices());
    if (id !== null) void dispatch(fetchServiceRequests(id));
  }, [dispatch, id]);

  const handleRespond = async (applicationId: number, action: 'accepted' | 'declined') => {
    setProcessingId(applicationId);
    setRespondError(null);
    try {
      await dispatch(respondToRequest({ applicationId, action, serviceId: id ?? undefined })).unwrap();
      if (action === 'accepted') {
        setActiveTab('active-tasks');
      }
    } catch (err) {
      setRespondError(rejectionMessage(err, 'Failed responding to request.'));
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return <Loader label="Loading Client Requests..." />;
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
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Client Requests
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            {service ? <>For <strong>{service.title}</strong> — </> : null}
            Review clients who want to hire this service. Accept to start the active task.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('my-services')}>
          ← Back to My Services
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No pending client requests for this service.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: 'var(--spacing-xl)' }}>
          {requests.map((req) => {
            const isProcessing = processingId === req.applicationId;

            return (
              <div
                key={req.applicationId}
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
                      {req.task?.title || 'Service Request'}
                    </h3>
                    <span className="admin-badge badge-warning">
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                    Client: {req.task?.client?.clientName || 'Client'}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {req.task?.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Offered Budget</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatCurrency(req.task?.budget || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button variant="outline" size="sm" disabled={isProcessing} onClick={() => handleRespond(req.applicationId, 'declined')}>
                      Decline
                    </Button>
                    <Button size="sm" disabled={isProcessing} onClick={() => handleRespond(req.applicationId, 'accepted')}>
                      Accept Offer
                    </Button>
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

export default ServiceRequests;
