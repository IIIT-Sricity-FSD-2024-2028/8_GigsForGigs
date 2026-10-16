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
import type { TaskDeliverableDefinition } from '../../../types/gig';
import { Badge } from '../../../components/common/Badge';

export const ProjectDetail: React.FC = () => {
  const { selectedTaskId, setActiveTab, navigateToSubmitDeliverable } = useGig();
  const [task, setTask] = useState<GigTask | null>(null);
  const [definitions, setDefinitions] = useState<TaskDeliverableDefinition[]>([]);
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
          setDefinitions([]);
          if (found) {
            try {
              const loadedDefinitions = await gigApi.getTaskDeliverableDefinitions(found.taskId);
              if (mounted) setDefinitions(loadedDefinitions);
            } catch (definitionError) {
              if (mounted) setError(definitionError instanceof ApiError ? definitionError.message : 'Could not load client-defined deliverables.');
            }
          }
          if (mounted) setLoading(false);
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
          Back to Active Task/Contracts
        </button>
      </div>
    );
  }

  const deliverables = task.deliverables || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Return Path to Active Task/Contracts */}
      <div>
        <button
          type="button"
          onClick={() => setActiveTab('active-tasks')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary-blue)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Back to Active Task/Contracts
        </button>
      </div>

      {error && <div role="alert" className="deliverable-feedback deliverable-feedback--error">{error}</div>}

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
      <div className="admin-card task-scope-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>Client-defined deliverables</h2>
        {definitions.length === 0 ? <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>The client has not added deliverables for this task yet.</p> :
          <div className="task-scope-list">{definitions.map(definition => {
            const latest = definition.submissions[0];
            const badge = !latest ? { label: 'Not submitted', variant: 'neutral' as const } :
              latest.status === 'approved' ? { label: 'Approved', variant: 'success' as const } :
                latest.status === 'revision_requested' ? { label: 'Revision requested', variant: 'warning' as const } :
                  latest.status === 'closed' ? { label: 'Closed', variant: 'neutral' as const } :
                    { label: 'Pending review', variant: 'pending' as const };
            return <article key={definition.definitionId} className="task-scope-item">
              <div><strong>{definition.title}</strong>{definition.description && <p>{definition.description}</p>}</div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {definition.submissions.length > 0 && <small>Submitted in {definition.submissions.length} delivery record{definition.submissions.length === 1 ? '' : 's'}</small>}
              {latest?.feedback && latest.status === 'revision_requested' && <small className="submission-definition__feedback">Latest revision feedback: {latest.feedback}</small>}
            </article>;
          })}</div>}
      </div>

      {/* Specification Content */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-sm)' }}>
            Project Requirements &amp; Scope
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-dark)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {task.description}
          </p>
        </div>

        {/* Deliverables History */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            Submissions &amp; Deliverable History ({deliverables.length})
          </h3>

          {deliverables.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              No deliverables have been submitted for this task yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {deliverables.map((del) => {
                const statusBadge =
                  del.status === 'approved'
                    ? { label: 'Approved', bg: '#e6f4ea', color: '#137333' }
                    : del.status === 'revision_requested'
                    ? { label: 'Revision Requested', bg: '#fff0f0', color: '#c5221f' }
                    : del.status === 'closed'
                    ? { label: 'Closed', bg: '#f1f3f4', color: '#5f6368' }
                    : { label: 'Awaiting Review', bg: '#e8f0fe', color: '#1a73e8' };

                return (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                          Deliverable #{del.deliverableNo}
                        </h4>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          ● {statusBadge.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Submitted: {del.createdAt ? new Date(del.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)', margin: '4px 0' }}>
                      {del.description}
                    </p>

                    {del.submissionPath && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        <strong>Notes / Link:</strong> {del.submissionPath}
                      </div>
                    )}

                    {del.claimedDefinitions && del.claimedDefinitions.length > 0 && (
                      <div className="submission-definition__claims">
                        <strong>Included task deliverables:</strong>
                        <ul>{del.claimedDefinitions.map(item => <li key={item.definitionId}>{item.title}</li>)}</ul>
                      </div>
                    )}

                    {del.feedback && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '10px 14px',
                          backgroundColor: del.status === 'revision_requested' ? '#FFF5F5' : '#F0F9FF',
                          borderRadius: '6px',
                          border: del.status === 'revision_requested' ? '1px solid #FED7D7' : '1px solid #BAE6FD',
                          fontSize: '12px',
                        }}
                      >
                        <strong style={{ color: del.status === 'revision_requested' ? '#C53030' : '#0369A1' }}>
                          Client Feedback:
                        </strong>{' '}
                        <span style={{ color: 'var(--color-text-dark)' }}>{del.feedback}</span>
                      </div>
                    )}

                    {del.status === 'revision_requested' && (
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => navigateToSubmitDeliverable(String(task.taskId))}
                        >
                          Submit Updated Work
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
