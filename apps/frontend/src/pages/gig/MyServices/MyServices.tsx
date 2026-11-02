import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import type { GigService } from '../../../types/gig';
import { Loader } from '../../../components/common/Loader';
import { Button, ConfirmDialog, useToast } from '../../../components/common';

export const MyServices: React.FC = () => {
  const toast = useToast();
  const { setActiveTab, navigateToServiceRequests, refreshTrigger, triggerRefresh } = useGig();
  const [services, setServices] = useState<GigService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [serviceToRemove, setServiceToRemove] = useState<GigService | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await gigApi.getServices();
        if (mounted) {
          setServices(data || []);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [refreshTrigger]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const confirmRemove = async () => {
    if (!serviceToRemove) return;
    const service = serviceToRemove;
    setRemovingId(service.serviceId);
    try {
      await gigApi.removeService(service.serviceId);
      toast.success(`Removed "${service.title}".`);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to remove service:', err);
      toast.error('Failed to remove service.');
    } finally {
      setRemovingId(null);
      setServiceToRemove(null);
    }
  };

  if (loading) {
    return <Loader label="Loading your posted services..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Page Header Banner */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #0c61a6 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff', marginBottom: 'var(--spacing-xs)' }}>
            My Posted Services ({services.length})
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)' }}>
            Manage your active marketplace service offerings available for clients to discover and hire.
          </p>
        </div>
        <Button onClick={() => setActiveTab('post-service')}>
          + Post New Service
        </Button>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        {services.map((srv) => (
          <div
            key={srv.serviceId}
            className="admin-card"
            style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #DCE3E8',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 'var(--spacing-md)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#e6f4ea',
                    color: '#137333',
                    letterSpacing: '0.04em'
                  }}
                >
                  ● LIVE &amp; AVAILABLE
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Posted {formatDate(srv.createdAt)}
                </span>
              </div>

              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px', lineHeight: 1.3 }}>
                {srv.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', lineHeight: 1.5, marginBottom: '12px' }}>
                {srv.description}
              </p>

              {/* Tags / Category */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {srv.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-bg-light)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Proposed Price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D568D' }}>
                  {formatCurrency(srv.price)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" onClick={() => toast.info(`Editing service "${srv.title}"...`)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removingId === srv.serviceId}
                  onClick={() => setServiceToRemove(srv)}
                >
                  Remove
                </Button>
                <Button size="sm" onClick={() => navigateToServiceRequests(String(srv.serviceId))}>
                  Client Requests
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={serviceToRemove !== null}
        title="Remove this service?"
        message={serviceToRemove && `"${serviceToRemove.title}" will no longer be visible to clients, who won't be able to find or hire it.`}
        confirmLabel="Remove"
        danger
        loading={removingId === serviceToRemove?.serviceId}
        onConfirm={confirmRemove}
        onCancel={() => setServiceToRemove(null)}
      />
    </div>
  );
};

export default MyServices;

