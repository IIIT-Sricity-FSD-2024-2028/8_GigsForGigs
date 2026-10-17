/**
 * @file CompletedProjects.tsx
 * @description
 * Completed projects portfolio view for Gig Professionals.
 * Displays completed tasks, two-sided review feedback (Client's review & Professional's review),
 * payout amounts, and completion dates with modal-based review submission.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { CompletedProject } from '../../../types/gig';
import { GigReviewModal } from '../../../components/gig/modals/GigReviewModal';

export const CompletedProjects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<CompletedProject | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await gigApi.getCompletedProjects();
      setProjects(res);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load completed projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            border: '1px solid #BCF0DA',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#03543F',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: 'var(--spacing-xl)' }}>
          {projects.map((proj) => {
            const reviews = proj.reviews || [];

            // Reliable direction disambiguation using reviewerId and revieweeId:
            // Gig Professional's review of the Client: reviewerId matches authenticated user's userId
            const myReview = user?.userId
              ? reviews.find((r) => r.reviewerId === user.userId)
              : undefined;

            // Client's review of the Gig Professional: revieweeId matches authenticated user's userId and reviewerId differs
            const clientReview = user?.userId
              ? reviews.find((r) => r.reviewerId !== user.userId && r.revieweeId === user.userId)
              : undefined;

            const hasReviewedClient = Boolean(myReview);
            const payment = proj.payment;

            return (
              <div
                key={proj.taskId}
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-md)',
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
                    Client: {proj.client?.clientName || 'Client'}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                    {proj.description}
                  </p>

                  {/* Two-Sided Reviews Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
                    {/* 1. Client's Review of Gig Professional */}
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: clientReview ? '#F0FDF4' : 'var(--color-bg-light)',
                        borderRadius: 'var(--radius-md)',
                        border: clientReview ? '1px solid #BBF7D0' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: clientReview ? '#15803D' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Client Review ({clientReview?.reviewerName || proj.client?.clientName || 'Client'})
                        </span>
                        {clientReview && (
                          <span style={{ color: '#B45F00', fontSize: '0.85rem', fontWeight: 700 }}>
                            {'★'.repeat(clientReview.rating)}{'☆'.repeat(5 - clientReview.rating)} ({clientReview.rating}.0)
                          </span>
                        )}
                      </div>
                      {clientReview ? (
                        <>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                            "{clientReview.comment || 'No written comment provided.'}"
                          </p>
                          {clientReview.createdAt && (
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                              {formatDate(clientReview.createdAt)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          No review left by client yet.
                        </div>
                      )}
                    </div>

                    {/* 2. Gig Professional's Review of Client */}
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: myReview ? '#F0F9FF' : 'var(--color-bg-light)',
                        borderRadius: 'var(--radius-md)',
                        border: myReview ? '1px solid #BAE6FD' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: myReview ? '#0369A1' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Your Review of Client
                        </span>
                        {myReview && (
                          <span style={{ color: '#B45F00', fontSize: '0.85rem', fontWeight: 700 }}>
                            {'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)} ({myReview.rating}.0)
                          </span>
                        )}
                      </div>
                      {myReview ? (
                        <>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                            "{myReview.comment || 'No written comment provided.'}"
                          </p>
                          {myReview.createdAt && (
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                              {formatDate(myReview.createdAt)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          You haven't reviewed this client yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer with Financial Info and Review Action */}
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

                    {/* Review Action */}
                    {hasReviewedClient ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          backgroundColor: '#F3F4F6',
                          color: '#6B7280',
                          border: '1px solid #D1D5DB',
                          cursor: 'not-allowed',
                          fontWeight: 600,
                        }}
                        disabled
                        title="You have already reviewed this client for this task"
                      >
                        ✓ Review Submitted
                      </button>
                    ) : payment ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          fontWeight: 700,
                          borderColor: 'var(--color-secondary)',
                          color: 'var(--color-secondary)',
                        }}
                        onClick={() => setSelectedProjectForReview(proj)}
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

      {/* Review Modal */}
      {selectedProjectForReview && (
        <GigReviewModal
          isOpen={Boolean(selectedProjectForReview)}
          onClose={() => setSelectedProjectForReview(null)}
          taskId={selectedProjectForReview.taskId}
          taskTitle={selectedProjectForReview.title}
          clientName={selectedProjectForReview.client?.clientName || 'Client'}
          onSuccess={async () => {
            const clientName = selectedProjectForReview.client?.clientName || 'Client';
            await loadProjects();
            setSuccessMessage(`Review for ${clientName} submitted successfully!`);
            setSelectedProjectForReview(null);
          }}
        />
      )}
    </div>
  );
};

export default CompletedProjects;
