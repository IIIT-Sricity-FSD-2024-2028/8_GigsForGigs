/**
 * @file ServicePublished.tsx
 * @description
 * Confirmation page displayed after publishing a new service package.
 */

import React from 'react';
import { useGig } from '../../../context/GigContext/GigContext';

export const ServicePublished: React.FC = () => {
  const { setActiveTab } = useGig();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xxl)',
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-lg)'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-info-bg)',
            border: '2px solid var(--color-info-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'var(--color-info-text)'
          }}
        >
          🚀
        </div>

        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Service Package Published!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
            Your service package is now active on the GigsForGigs marketplace catalog. Clients and account managers can hire you directly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%', justifyContent: 'center', marginTop: 'var(--spacing-md)' }}>
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => setActiveTab('profile')}
          >
            View My Profile
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setActiveTab('dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePublished;
