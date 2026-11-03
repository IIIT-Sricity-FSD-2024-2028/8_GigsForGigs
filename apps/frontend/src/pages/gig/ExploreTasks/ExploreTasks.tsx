/**
 * @file ExploreTasks.tsx
 * @description
 * Marketplace task discovery view for Gig Professionals.
 * Displays open client tasks with search filtering, budget badges,
 * detail inspection, and application tracking with instant UI feedback.
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
import { Button, useToast } from '../../../components/common';

export const ExploreTasks: React.FC = () => {
  const [tasks, setTasks] = useState<GigTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { taskSearch: searchQuery } = useGig();
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { if (error) toast.error(error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const res = await gigApi.getMarketplaceTasks();
        if (mounted) {
          setTasks(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load marketplace tasks.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleApply = async (taskId: number) => {
    setApplyingId(taskId);
    setError(null);
    try {
      await gigApi.applyForTask(taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId)); // moves to Applied Tasks
      toast.success('Applied! Track it under Applied Tasks.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to apply for task.');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.client?.clientName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return <Loader label="Loading marketplace tasks..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {error && <ErrorState title="Marketplace update" message={error} />}

      {/* Search Header */}
      <PageHeader title="Explore Marketplace Tasks" description="Discover open client tasks, submit competitive proposals, and expand your engagement portfolio. Use the search box in the top bar to filter." />

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState title="No marketplace tasks found" description="Try broadening your keywords." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 'var(--spacing-xl)' }}>
          {filteredTasks.map((task) => {
            const isSubmitting = applyingId === task.taskId;

            return (
              <div
                key={task.taskId}
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-dark)', flex: 1 }}>
                      {task.title}
                    </h3>
                    <span className="admin-badge badge-success" style={{ fontSize: 'var(--font-size-xs)' }}>
                      {formatCurrency(task.budget)}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                    Client: {task.client?.clientName || 'Client'}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {task.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Status: <strong style={{ color: 'var(--color-primary-dark)' }}>{task.status.toUpperCase()}</strong>
                  </span>
                  <Button variant="primary" disabled={isSubmitting} onClick={() => handleApply(task.taskId)}>
                    {isSubmitting ? 'Submitting...' : 'Apply Now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreTasks;
