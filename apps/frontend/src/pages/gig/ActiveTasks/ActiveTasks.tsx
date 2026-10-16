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
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { ErrorState } from '../../../components/common/ErrorState';

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

  if (loading) {
    return <Loader label="Loading active tasks..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {error && <ErrorState title="Could not load active tasks" message={error} />}

      {/* Header */}
      <PageHeader title="Active Task/Contracts" description="Manage your ongoing client deliverables, inspect milestone requirements, and submit finished work." />

      {activeTasks.length === 0 ? (
        <EmptyState title="No active tasks" description="Explore the marketplace to pick up new work." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {activeTasks.map((task) => {
            const deliverables = task.deliverables || [];
            const hasSubmissions = deliverables.length > 0;
            const progress = task.progress ?? 0;

            return (
              <div
                key={task.taskId}
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
                    {hasSubmissions ? (
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
                        ● Deliverable Submitted
                      </span>
                    ) : (
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
                        ● Work In Progress
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                    Client: <strong>{task.client?.clientName || 'Client'}</strong>
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
                    onClick={() => navigateToTaskDetail(String(task.taskId))}
                  >
                    View Details
                  </button>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => navigateToSubmitDeliverable(String(task.taskId))}
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
