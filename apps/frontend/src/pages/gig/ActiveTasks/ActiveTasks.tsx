/**
 * @file ActiveTasks.tsx
 * @description
 * Ongoing engagements list for Gig Professionals.
 * Displays currently active tasks, progress metrics, deliverable submission history,
 * and direct action buttons for detailed inspection or deliverable uploads.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { GigTask } from '../../../types/gig';

export const ActiveTasks: React.FC = () => {
  const { navigateToTaskDetail, navigateToSubmitDeliverable, refreshTrigger } = useGig();
  const [activeTasks, setActiveTasks] = useState<GigTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const tasks = await gigApi.getActiveTasks();
        if (mounted) {
          setActiveTasks(tasks);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load active tasks.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Active Tasks...
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

      {/* Header */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Active Task Engagements
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          Manage your ongoing client deliverables, inspect milestone requirements, and submit finished work.
        </p>
      </div>

      {activeTasks.length === 0 ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No active tasks currently assigned. Explore the marketplace to pick up new work!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {activeTasks.map((task) => {
            const deliverables = task.deliverables || [];
            const hasSubmissions = deliverables.length > 0;
            const progress = task.progress || (hasSubmissions ? 60 : 20);

            return (
              <div
                key={task.task_id}
                className="admin-card"
                style={{
                  padding: 'var(--spacing-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-xl)',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left Task Meta */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                      {task.title}
                    </h3>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#e8f0fe',
                        color: '#1a73e8'
                      }}
                    >
                      ● Deliverable: UNDER REVIEW
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}
                    >
                      Payment: Awaiting Client Approval
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                    Client: <strong>{task.client_id}</strong>
                  </div>

                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                    {task.description}
                  </p>

                  {/* Progress Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', width: '100%', maxWidth: '400px' }}>
                    <div style={{ flex: 1, backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-pill)', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progress}%`,
                          backgroundColor: 'var(--color-secondary)',
                          height: '100%',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      {progress}% Progress
                    </span>
                  </div>
                </div>

                {/* Right Action Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'flex-end', minWidth: '180px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0D568D' }}>
                    ₹{Number(task.budget).toLocaleString('en-IN')}
                  </div>
                  <button
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => navigateToTaskDetail(task.task_id)}
                  >
                    View Details
                  </button>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => navigateToSubmitDeliverable(task.task_id)}
                  >
                    Submit Deliverable
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveTasks;
