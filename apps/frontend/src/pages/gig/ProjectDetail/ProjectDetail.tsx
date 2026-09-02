/**
 * @file ProjectDetail.tsx
 * @description
 * In-depth task inspection view for Gig Professionals.
 * Displays comprehensive task requirements, client info, budget, status, and deliverable history.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { GigTask } from '../../../types/gig';

export const ProjectDetail: React.FC = () => {
  const { selectedTaskId, setActiveTab, navigateToSubmitDeliverable } = useGig();
  const [task, setTask] = useState<GigTask | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const active = await gigApi.getActiveTasks();
        if (mounted) {
          const found = active.find((t) => String(t.taskId) === selectedTaskId) || active[0] || null;
          setTask(found);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load task.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [selectedTaskId]);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Task Specifications...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>Task Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
          {error || 'The requested task could not be found or is no longer active.'}
        </p>
        <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('active-tasks')}>
          Back to Active Tasks
        </button>
      </div>
    );
  }

  const deliverables = task.deliverables || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Header Context Card */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {task.title}
            </h1>
            <span className="admin-badge badge-info">{task.status.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Task Ref ID: <strong>{task.taskId}</strong> • Client: <strong>{task.client?.clientName || 'Client'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            {formatCurrency(task.budget)}
          </span>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigateToSubmitDeliverable(String(task.taskId))}
          >
            Submit Deliverable
          </button>
        </div>
      </div>

      {/* Specification Content */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            Project Requirements & Scope
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-dark)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {task.description}
          </p>
        </div>

        {/* Deliverables History */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            Submissions & Deliverable History ({deliverables.length})
          </h3>

          {deliverables.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              No deliverables have been submitted for this task yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {deliverables.map((del) => (
                <div
                  key={`${del.taskId}-${del.deliverableNo}`}
                  style={{
                    padding: 'var(--spacing-lg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      Deliverable #${del.deliverableNo}
                    </h4>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Submitted: {del.createdAt ? new Date(del.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)', margin: '4px 0' }}>
                    {del.description}
                  </p>
                  {del.submissionPath && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      <strong>Notes:</strong> {del.submissionPath}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
