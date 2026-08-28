/**
 * @file TotalEarnings.tsx
 * @description
 * Financial dashboard and earnings ledger view for Gig Professionals.
 * Displays YTD income metrics, withdrawal controls, and payout transaction history.
 */

import React, { useEffect, useState } from 'react';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import type { EarningsSummary } from '../../../types/gig';

export const TotalEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<EarningsSummary>({ totalEarnings: 0, completedTasks: 0, payments: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [withdrawing, setWithdrawing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setError(null);
      try {
        const res = await gigApi.getEarnings();
        if (mounted) {
          setEarnings(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load earnings.');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  const handleWithdraw = () => {
    if (earnings.totalEarnings <= 0) {
      alert('No funds available for withdrawal.');
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
        Loading Financial Ledger...
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

      {/* Banner & Withdrawal Action */}
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
            Financial Ledger & Earnings
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Track total income, escrow releases, and payout transaction history.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          style={{ padding: '0.8rem 1.6rem', fontSize: 'var(--font-size-base)' }}
          disabled={withdrawing}
          onClick={handleWithdraw}
        >
          {withdrawing ? 'Processing Withdrawal...' : 'Withdraw Funds to Bank'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Total YTD Net Earnings
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 'var(--spacing-xs) 0' }}>
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-secondary)', fontWeight: 600 }}>
            From {earnings.completedTasks} Completed Tasks
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Available for Withdrawal
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-secondary)', margin: 'var(--spacing-xs) 0' }}>
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-text)', fontWeight: 600 }}>
            Cleared & Ready
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Active Contract Escrow
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-blue)', margin: 'var(--spacing-xs) 0' }}>
            $8,300
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Held in Escrow Protection
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Recent Payout Transactions
        </h2>

        {earnings.payments.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No transaction records found yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>Date</th>
                  <th style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>Description</th>
                  <th style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>Task Reference</th>
                  <th style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>Amount</th>
                  <th style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payments.map((p, idx) => (
                  <tr key={p.payment_id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-text-muted)' }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px var(--spacing-sm)', fontWeight: 600 }}>
                      Contract Milestone Payment Release
                    </td>
                    <td style={{ padding: '12px var(--spacing-sm)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                      {p.task_id}
                    </td>
                    <td style={{ padding: '12px var(--spacing-sm)', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '12px var(--spacing-sm)' }}>
                      <span className="admin-badge badge-success">Paid</span>
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
