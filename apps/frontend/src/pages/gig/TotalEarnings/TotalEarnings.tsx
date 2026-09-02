import React, { useEffect, useState } from 'react';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { EarningsSummary } from '../../../types/gig';

export const TotalEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<EarningsSummary>({ totalEarnings: 0, completedTasks: 0, payments: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await gigApi.getEarnings();
        if (mounted) setEarnings(data);
      } catch (err) {
        console.error(err instanceof ApiError ? err.message : 'Failed to load earnings.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const pendingTotal = earnings.payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const failedTotal = earnings.payments
    .filter(p => p.status === 'failed')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleWithdraw = () => {
    if (earnings.totalEarnings <= 0) {
      alert('No cleared earnings available for withdrawal yet.');
      return;
    }
    setWithdrawing(true);
    setTimeout(() => {
      alert(`Successfully initiated payout withdrawal of ${formatCurrency(earnings.totalEarnings)} to your registered bank account!`);
      setWithdrawing(false);
    }, 800);
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
        Loading Earnings...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Header Banner */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #053661 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-lg)'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ffffff' }}>
            Earnings &amp; Project Payouts
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            View your completed, pending, and failed project payments.
          </p>
        </div>
        <button
          className="admin-btn"
          style={{ padding: '0.8rem 1.6rem', fontSize: 'var(--font-size-base)', backgroundColor: '#D47700', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          disabled={withdrawing}
          onClick={handleWithdraw}
        >
          {withdrawing ? 'Processing Withdrawal...' : `Withdraw ${formatCurrency(earnings.totalEarnings)} to Bank`}
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Available Earnings
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#084b83', margin: '6px 0' }}>
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#137333', fontWeight: 600 }}>
            Cleared &amp; Ready for Payout
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Pending Payments
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#bf6900', margin: '6px 0' }}>
            {formatCurrency(pendingTotal)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#1a73e8', fontWeight: 600 }}>
            Awaiting Client Payment Release
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Failed Payments
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9B1C1C', margin: '6px 0' }}>
            {formatCurrency(failedTotal)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#805C54', fontWeight: 600 }}>
            Did Not Process
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Completed Tasks
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#137333', margin: '6px 0' }}>
            {earnings.completedTasks}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#137333', fontWeight: 600 }}>
            All-Time Finished Projects
          </span>
        </div>
      </div>

      {/* Payment Security Notice for Gig Professional */}
      <div style={{ backgroundColor: '#E8F0FE', border: '1px solid #D2E3FC', borderRadius: '12px', padding: '16px 20px', color: '#1A73E8', fontSize: '14px', lineHeight: 1.5 }}>
        <strong>🛡️ Payment Protection Notice:</strong> The Client completes the payment before work begins. Your earnings will be released after the completed work is approved.
      </div>

      {/* Payouts Ledger Table */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: '#084b83' }}>
          Project Payout Ledger
        </h2>

        {earnings.payments.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: '#805C54' }}>
            No payment records associated with your profile yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #DBDFDF', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: '#805C54' }}>Task Title</th>
                  <th style={{ padding: '12px 16px', color: '#805C54' }}>Client Name</th>
                  <th style={{ padding: '12px 16px', color: '#805C54', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', color: '#805C54', textAlign: 'center' }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payments.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: '1px solid #DBDFDF' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#502419' }}>
                      {p.task?.title || 'Untitled Task'}
                      <div style={{ fontSize: '11px', color: '#805C54', fontFamily: 'monospace' }}>PAY-{p.paymentId}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#502419' }}>
                      {p.task?.client?.clientName || 'Client'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#137333', textAlign: 'right' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`admin-badge ${
                        p.status === 'completed'
                          ? 'badge-success'
                          : p.status === 'pending'
                            ? 'badge-info'
                            : 'badge-neutral'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalEarnings;
