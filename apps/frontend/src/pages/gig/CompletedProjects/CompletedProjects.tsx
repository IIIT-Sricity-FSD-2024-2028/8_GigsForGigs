/**
 * @file CompletedProjects.tsx
 * @description
 * Completed projects portfolio view for Gig Professionals.
 * Displays completed tasks, client feedback star ratings, payout amounts, and completion dates.
 */

import React, { useEffect, useState } from 'react';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { CompletedProject } from '../../../types/gig';

export const CompletedProjects: React.FC = () => {
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const res = await gigApi.getCompletedProjects();
        if (mounted) {
          setProjects(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load completed projects.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Completed Projects...
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

      {/* Banner */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Completed Projects Portfolio
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            History of successfully executed engagements, verified client feedback, and escrow payouts.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Finished</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{projects.length}</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No completed projects found in your portfolio yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {projects.map((proj) => {
            const review = proj.reviews?.[0];
            const payment = proj.payment;

            return (
              <div
                key={proj.task_id}
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
                      {proj.title}
                    </h3>
                    <span className="admin-badge badge-success">Completed</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                    Client: {proj.client_id}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                    {proj.description}
                  </p>

                  {/* Client Review Section */}
                  {review ? (
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '4px' }}>
                        <span style={{ color: '#facc15', fontSize: '1.1rem' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                          ({review.rating}.0 Rating)
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>
                        "{review.comment}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      No rating left by client yet.
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Contract Value</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {formatCurrency(proj.budget)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {payment ? (
                      <span className="admin-badge badge-success">
                        Paid {formatCurrency(payment.amount || proj.budget)}
                      </span>
                    ) : (
                      <span className="admin-badge badge-warning">
                        Payment Pending
                      </span>
                    )}

                    {/* Gig -> Client Review Eligibility (Only allowed after payment completion) */}
                    {payment ? (
                      <button
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => {
                          const rating = prompt('Rate Client Communication & Requirement Clarity (1 to 5 stars):', '5');
                          if (rating) {
                            const comment = prompt('Leave feedback for the Client:', 'Clear requirements and excellent communication throughout the project.');
                            if (comment) {
                              alert(`Review submitted for Client: ${rating} Stars - "${comment}"`);
                            }
                          }
                        }}
                      >
                        ★ Review Client
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Review available after payment
                      </span>
                    )}
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

export default CompletedProjects;
