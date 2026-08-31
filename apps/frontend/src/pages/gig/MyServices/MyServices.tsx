import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import type { GigService } from '../../../types/gig';

export const MyServices: React.FC = () => {
  const { setActiveTab, refreshTrigger } = useGig();
  const [services, setServices] = useState<GigService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading your posted services...
      </div>
    );
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
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setActiveTab('post-service')}
        >
          + Post New Service
        </button>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {services.map((srv) => (
          <div
            key={srv.service_id}
            className="admin-card"
            style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #DBDFDF',
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

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Proposed Price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D568D' }}>
                  {formatCurrency(srv.price)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => alert(`Editing service "${srv.title}"...`)}
                  style={{ fontSize: '12px' }}
                >
                  Edit
                </button>
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => setActiveTab('pending-requests')}
                  style={{ fontSize: '12px' }}
                >
                  Client Requests
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyServices;

