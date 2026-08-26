/**
 * @file SubmissionSuccess.tsx
 * @description
 * Confirmation page displayed after successful deliverable submission.
 */

import React from 'react';
import { useGig } from '../../../context/GigContext/GigContext';

export const SubmissionSuccess: React.FC = () => {
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
            backgroundColor: 'var(--color-success-bg)',
            border: '2px solid var(--color-success-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'var(--color-success-text)'
          }}
        >
          ✓
        </div>

        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Deliverable Submitted!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
            Your work deliverable has been recorded and submitted for client review. The project manager will inspect the submission.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%', justifyContent: 'center', marginTop: 'var(--spacing-md)' }}>
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => setActiveTab('active-tasks')}
          >
            Back to Active Tasks
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

export default SubmissionSuccess;
