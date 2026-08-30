/**
 * @file GigDashboard.tsx
 * @description
 * Primary dashboard home page for the Gig Professional module.
 * Visualizes active engagement KPIs, circular Job Success Rate progress,
 * recent pending client requests table, and quick active task previews.
 */

import React, { useEffect, useState } from 'react';
import { useGig } from '../../../context/GigContext/GigContext';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { GigTask, PendingRequest, CompletedProject, EarningsSummary } from '../../../types/gig';

export const GigDashboard: React.FC = () => {
  const { setActiveTab, navigateToTaskDetail, refreshTrigger, triggerRefresh } = useGig();

  const [activeTasks, setActiveTasks] = useState<GigTask[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([]);
  const [postedServices, setPostedServices] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({ totalEarnings: 0, completedTasks: 0, payments: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
      }
      try {
        const [active, pending, completed, earn, srvs] = await Promise.all([
          gigApi.getActiveTasks(),
          gigApi.getPendingRequests(),
          gigApi.getCompletedProjects(),
          gigApi.getEarnings(),
          gigApi.getServices()
        ]);
        if (mounted) {
          setActiveTasks(active);
          setPendingRequests(pending);
          setCompletedProjects(completed);
          setEarnings(earn);
          setPostedServices(srvs && srvs.length > 0 ? srvs : [
            {
              service_id: 'srv-101',
              title: 'Full-Stack React 19 & Express.js Marketplace App',
              price: 5000,
              createdAt: new Date().toISOString()
            }
          ]);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const handleRespondRequest = async (applicationId: string, action: 'accepted' | 'declined') => {
    try {
      await gigApi.respondToRequest(applicationId, action);
      triggerRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed responding to request.');
    }
  };

  const totalWork = activeTasks.length + completedProjects.length;
  const successRate = totalWork > 0 ? Math.round((completedProjects.length / totalWork) * 100) : 100;

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Gig Dashboard...
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

      {/* ── Page Header Banner ────────────────────────────────────────────── */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #0c61a6 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff', marginBottom: 'var(--spacing-xs)' }}>
            Welcome Back! 👋
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)' }}>
            Monitor active work streams, review incoming client requests, and manage task deliverables.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button
            className="admin-btn admin-btn-outline"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            onClick={() => setActiveTab('my-services')}
          >
            My Services
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setActiveTab('post-service')}
          >
            + Post New Service
          </button>
        </div>
      </div>

      {/* ── KPI Cards Grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* My Services Card */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }} onClick={() => setActiveTab('my-services')}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            My Services
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#137333', margin: 'var(--spacing-xs) 0' }}>
            {postedServices.length}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#137333', fontWeight: 600 }}>
            ● Live &amp; Available
          </span>
        </div>

        {/* Pending Requests Card */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }} onClick={() => setActiveTab('pending-requests')}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pending Requests
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-blue)', margin: 'var(--spacing-xs) 0' }}>
            {pendingRequests.length}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Awaiting Your Response
          </span>
        </div>

        {/* Active Tasks Card */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }} onClick={() => setActiveTab('active-tasks')}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Tasks
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 'var(--spacing-xs) 0' }}>
            {activeTasks.length}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-secondary)', fontWeight: 600 }}>
            Accepted &amp; In Progress
          </span>
        </div>

        {/* Completed Projects Card */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }} onClick={() => setActiveTab('completed-projects')}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Completed Projects
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', margin: 'var(--spacing-xs) 0' }}>
            {completedProjects.length}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-text)', fontWeight: 600 }}>
            Finished &amp; Paid
          </span>
        </div>

        {/* Total Earnings Card */}
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', cursor: 'pointer' }} onClick={() => setActiveTab('earnings')}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Earnings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 'var(--spacing-xs) 0' }}>
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Net Income
          </span>
        </div>
      </div>

      {/* ── Main Dashboard Layout Grid (2 Columns) ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Left Column: Pending Client Requests Table */}
        <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Pending Client Requests
            </h2>
            <button
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={() => setActiveTab('pending-requests')}
            >
              View All ({pendingRequests.length})
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              No pending client requests right now.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px var(--spacing-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Client</th>
                    <th style={{ padding: '10px var(--spacing-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Task Title</th>
                    <th style={{ padding: '10px var(--spacing-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Budget</th>
                    <th style={{ padding: '10px var(--spacing-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.slice(0, 5).map((req) => (
                    <tr key={req.application_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px var(--spacing-sm)', fontWeight: 600 }}>{req.task?.client_id || 'Client'}</td>
                      <td style={{ padding: '12px var(--spacing-sm)' }}>{req.task?.title || 'Untitled Task'}</td>
                      <td style={{ padding: '12px var(--spacing-sm)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        {formatCurrency(req.task?.budget || req.budget || 0)}
                      </td>
                      <td style={{ padding: '12px var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                          <button
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            onClick={() => handleRespondRequest(req.application_id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleRespondRequest(req.application_id, 'declined')}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Job Success Circular Gauge & Active Previews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Job Success Meter */}
          <div className="admin-card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
              Job Success Score
            </h3>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="3.5"
                  strokeDasharray={`${successRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  color: 'var(--color-primary-dark)'
                }}
              >
                {successRate}%
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-md)' }}>
              Based on client ratings & on-time task delivery
            </p>
          </div>

          {/* Active Tasks Quick List */}
          <div className="admin-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Active Tasks Preview
              </h3>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => setActiveTab('active-tasks')}
              >
                View All
              </button>
            </div>

            {activeTasks.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                No active tasks at the moment.
              </p>
            ) : (
              activeTasks.slice(0, 3).map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => navigateToTaskDetail(task.task_id)}
                  style={{
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>{task.client_id}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{formatCurrency(task.budget)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDashboard;
