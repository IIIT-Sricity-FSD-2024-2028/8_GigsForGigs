/**
 * @file ExploreTasks.tsx
 * @description
 * Marketplace task discovery view for Gig Professionals.
 * Displays open client tasks with search filtering, budget badges,
 * detail inspection, and application tracking with instant UI feedback.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { GigTask } from '../../../types/gig';

export const ExploreTasks: React.FC = () => {
  const { user, updateUserSession } = useAuth();
  const [tasks, setTasks] = useState<GigTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const appliedTaskIds = user?.appliedTaskIds || [];

  const handleApply = async (taskId: string) => {
    if (appliedTaskIds.includes(taskId)) return;
    setApplyingId(taskId);
    setError(null);
    try {
      await gigApi.applyForTask(taskId);
      const updated = Array.from(new Set([...appliedTaskIds, taskId]));
      updateUserSession({ appliedTaskIds: updated });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to apply for task.');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.client_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Marketplace Tasks...
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

      {/* Search Header */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Explore Marketplace Tasks
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Discover open client tasks, submit competitive proposals, and expand your engagement portfolio.
          </p>
        </div>
        <div style={{ minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Search by keyword, client, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No tasks matched your search query. Try broadening your keywords.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {filteredTasks.map((task) => {
            const isApplied = appliedTaskIds.includes(task.task_id);
            const isSubmitting = applyingId === task.task_id;

            return (
              <div
                key={task.task_id}
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
                    Client: {task.client_id}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {task.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Status: <strong style={{ color: 'var(--color-primary-dark)' }}>{task.status}</strong>
                  </span>
                  <button
                    className={`admin-btn ${isApplied ? 'admin-btn-outline' : 'admin-btn-primary'}`}
                    disabled={isApplied || isSubmitting}
                    onClick={() => handleApply(task.task_id)}
                  >
                    {isApplied ? 'Applied ✓' : isSubmitting ? 'Submitting...' : 'Apply Now'}
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

export default ExploreTasks;
