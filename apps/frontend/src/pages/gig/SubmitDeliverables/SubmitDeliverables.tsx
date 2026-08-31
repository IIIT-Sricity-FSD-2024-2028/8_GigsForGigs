/**
 * @file SubmitDeliverables.tsx
 * @description
 * Task deliverable submission form view.
 * Enables Gig Professionals to upload work descriptions, pull request links, and submission notes,
 * alongside reviewing existing deliverable history for the selected active task.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { GigTask } from '../../../types/gig';

export const SubmitDeliverables: React.FC = () => {
  const { selectedTaskId, setActiveTab, triggerRefresh } = useGig();
  const [task, setTask] = useState<GigTask | null>(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const active = await gigApi.getActiveTasks();
        if (mounted) {
          const found = active.find((t) => t.task_id === selectedTaskId) || active[0] || null;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!content.trim()) {
      setError('Please provide deliverable submission details or links.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await gigApi.submitDeliverable({
        taskId: task.task_id,
        content: content.trim(),
        notes: notes.trim()
      });
      triggerRefresh();
      setActiveTab('submission-success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error submitting deliverable.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Task Submission Workspace...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>No Active Task Selected</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
          Please select an active task from your Active Tasks dashboard to submit work deliverables.
        </p>
        <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('active-tasks')}>
          Go to Active Tasks
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
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

      {/* Task Context Card */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Active Task Engagement
          </span>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '4px 0' }}>
            {task.title}
          </h1>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Client: <strong>{task.client_id}</strong> • Budget: <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(task.budget)}</strong>
          </p>
        </div>
        <button
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={() => setActiveTab('project-detail')}
        >
          View Full Spec
        </button>
      </div>

      {/* Existing Deliverables History */}
      {task.deliverables && task.deliverables.length > 0 && (
        <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
            Previous Deliverables History ({task.deliverables.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {task.deliverables.map((del) => (
              <div
                key={del.deliverable_id || del.deliverable_no}
                style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-bg-light)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
                  Deliverable #{del.deliverable_no}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>{del.content}</div>
                {del.notes && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Note: {del.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form Card */}
      <form className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }} onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Submit New Deliverable
        </h2>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Submission Details / Pull Request Link *
          </label>
          <textarea
            className="admin-textarea"
            rows={5}
            placeholder="Describe your completed work, paste GitHub Pull Request links, or add Figma prototype URLs..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 'var(--spacing-xs)' }}>
            Additional Notes for Client (Optional)
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="e.g. Requires environment variable setup in staging..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => setActiveTab('active-tasks')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Deliverable for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitDeliverables;
