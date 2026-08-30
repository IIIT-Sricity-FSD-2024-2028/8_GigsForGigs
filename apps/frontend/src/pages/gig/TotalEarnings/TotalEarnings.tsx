import React, { useState } from 'react';
import { usePayments } from '../../../context/PaymentContext/PaymentContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';

export const TotalEarnings: React.FC = () => {
  const { user } = useAuth();
  const { payments } = usePayments();
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  const gigPayments = payments.filter(
    p => p.gigProfileId === String(user?.userId) || p.gigProName.toLowerCase().includes(user?.name?.toLowerCase() || 'elena')
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const completedEarnings = gigPayments
    .filter(p => p.status === 'COMPLETED' || p.status === 'RELEASED')
    .reduce((sum, p) => sum + p.gigAmount, 0);

  const securedPaymentsTotal = gigPayments
    .filter(p => p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL')
    .reduce((sum, p) => sum + p.gigAmount, 0);

  const pendingApprovalTotal = gigPayments
    .filter(p => p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL')
    .reduce((sum, p) => sum + p.gigAmount, 0);

  const handleWithdraw = () => {
    if (completedEarnings <= 0) {
      alert('No cleared earnings available for withdrawal yet.');
      return;
    }
    setWithdrawing(true);
    setTimeout(() => {
      alert(`Successfully initiated payout withdrawal of ${formatCurrency(completedEarnings)} to your registered bank account!`);
      setWithdrawing(false);
    }, 800);
  };

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
            View your secured project payments, pending approvals, and cleared earnings.
          </p>
        </div>
        <button
          className="admin-btn"
          style={{ padding: '0.8rem 1.6rem', fontSize: 'var(--font-size-base)', backgroundColor: '#D47700', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          disabled={withdrawing}
          onClick={handleWithdraw}
        >
          {withdrawing ? 'Processing Withdrawal...' : `Withdraw ${formatCurrency(completedEarnings)} to Bank`}
        </button>
      </div>

      {/* Four Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Available Earnings
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#084b83', margin: '6px 0' }}>
            {formatCurrency(completedEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#137333', fontWeight: 600 }}>
            Cleared &amp; Ready for Payout
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Payments Secured
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#bf6900', margin: '6px 0' }}>
            {formatCurrency(securedPaymentsTotal)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#1a73e8', fontWeight: 600 }}>
            Payment Secured for Project
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Awaiting Client Approval
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#519e8a', margin: '6px 0' }}>
            {formatCurrency(pendingApprovalTotal)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#805C54', fontWeight: 600 }}>
            Deliverables Under Review
          </span>
        </div>

        <div className="admin-card" style={{ padding: 'var(--spacing-lg)', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DBDFDF' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#805C54', textTransform: 'uppercase' }}>
            Total Completed Earnings
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#137333', margin: '6px 0' }}>
            {formatCurrency(completedEarnings)}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#137333', fontWeight: 600 }}>
            All-Time Released Payouts
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

        {gigPayments.length === 0 ? (
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
                  <th style={{ padding: '12px 16px', color: '#805C54', textAlign: 'right' }}>Agreed Payout</th>
                  <th style={{ padding: '12px 16px', color: '#805C54', textAlign: 'center' }}>Payment Status</th>
                  <th style={{ padding: '12px 16px', color: '#805C54', textAlign: 'right' }}>Transaction Ref</th>
                </tr>
              </thead>
              <tbody>
                {gigPayments.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: '1px solid #DBDFDF' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#502419' }}>
                      {p.taskTitle}
                      <div style={{ fontSize: '11px', color: '#805C54', fontFamily: 'monospace' }}>{p.paymentId}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#502419' }}>
                      {p.clientName}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#137333', textAlign: 'right' }}>
                      {formatCurrency(p.gigAmount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`admin-badge ${
                        p.status === 'COMPLETED' || p.status === 'RELEASED'
                          ? 'badge-success'
                          : p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL'
                            ? 'badge-info'
                            : p.status === 'ESCROWED'
                              ? 'badge-purple'
                              : 'badge-neutral'
                      }`}>
                        {p.status === 'ESCROWED' ? 'Payment Secured' : p.status === 'WORK_SUBMITTED' ? 'Awaiting Client Approval' : p.status === 'COMPLETED' || p.status === 'RELEASED' ? 'Payment Released' : p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#805C54' }}>
                      {p.transactionReference || 'TXN_SECURED_PAY'}
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
