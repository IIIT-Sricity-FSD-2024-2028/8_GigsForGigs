import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';
import { usePayments, type EscrowPayment } from '../../../context/PaymentContext/PaymentContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';

export interface TotalSpentProps {
  onNavigate: (viewId: string) => void;
}

export const TotalSpent: React.FC<TotalSpentProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { contracts } = useClient();
  const { payments, confirmEscrowPayment } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [payingPayment, setPayingPayment] = useState<EscrowPayment | null>(null);

  const clientPayments = payments.filter(
    p => p.clientId === String(user?.userId) || p.clientName.toLowerCase().includes(user?.name?.toLowerCase() || 'aditya')
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalSpent = clientPayments
    .filter(p => p.status === 'COMPLETED' || p.status === 'RELEASED')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const escrowLockedTotal = clientPayments
    .filter(p => p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const filteredPayments = clientPayments.filter(p =>
    p.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.gigProName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePayNow = async (paymentId: string) => {
    await confirmEscrowPayment(paymentId);
    setPayingPayment(null);
    alert('Payment successful! ₹5,100 has been securely locked in escrow until work approval.');
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 className="page-title">Client Payments & Escrow Ledger</h1>
        <p className="page-subtitle">Track task payments, platform fees, and escrow statuses securely.</p>
      </div>

      <section className="spent-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        
        {/* Spend Hero */}
        <article className="spent-hero" style={{ background: 'var(--color-primary-dark)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', color: 'var(--color-white)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="spent-kicker" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: 'var(--spacing-xs)' }}>
              Total Expenditure Released
            </div>
            <div className="spent-total" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div className="spent-meta" style={{ display: 'flex', gap: 'var(--spacing-xl)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--spacing-md)' }}>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>Funds Held in Escrow</div>
              <div className="value" style={{ fontWeight: 700, color: '#FDE68A' }}>{formatCurrency(escrowLockedTotal)}</div>
              <div className="sub" style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>Secured by Platform</div>
            </div>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>Active Task Contracts</div>
              <div className="value" style={{ fontWeight: 700 }}>{contracts.length} Tasks</div>
              <div className="sub" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Across verified professionals</div>
            </div>
          </div>
        </article>

        {/* Payment Model Guarantee Card */}
        <article className="spent-budget" style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0D568D', fontWeight: 700, marginBottom: '8px' }}>🛡️ Escrow Protection Guarantee</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              Your money is protected. When you fund a task, your payment is held securely in escrow and only released after you inspect and approve the completed deliverable.
            </p>
          </div>
          <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '12px', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 600, color: '#0D568D', marginBottom: '4px' }}>Payment Calculation Rule:</div>
            <div style={{ color: '#502419' }}>
              Total Payable = Gig Agreed Amount + ₹100 Platform Fee
            </div>
          </div>
        </article>
      </section>

      {/* Escrow Payments Table */}
      <section className="spent-table-wrap" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-white)' }}>
        <div className="spent-table-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(8, 75, 131, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Task Payment Ledger</h3>
          <div className="topbar-search" style={{ border: '1px solid var(--color-border)', background: 'var(--color-white)', padding: '4px 8px', borderRadius: '6px', width: '240px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Filter payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        <table className="activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Payment / Task</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Gig Professional</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Gig Amount</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Platform Fee</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Paid</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                  No payment records found.
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p.paymentId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{p.taskTitle}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.paymentId}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{p.gigProName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.gigAmount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>+{formatCurrency(p.platformFee)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0D568D' }}>{formatCurrency(p.totalAmount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: p.status === 'COMPLETED' || p.status === 'RELEASED' ? '#e6f4ea' : p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' ? '#e8f0fe' : p.status === 'DISPUTED' ? '#fef7e0' : '#f1f3f4',
                      color: p.status === 'COMPLETED' || p.status === 'RELEASED' ? '#137333' : p.status === 'ESCROWED' || p.status === 'WORK_SUBMITTED' ? '#1a73e8' : p.status === 'DISPUTED' ? '#b06000' : '#5f6368'
                    }}>
                      {p.status === 'ESCROWED' ? 'Funds Secured' : p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {p.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => setPayingPayment(p)}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#D47700', color: '#FFFFFF', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Pay {formatCurrency(p.totalAmount)}
                      </button>
                    ) : p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL' ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('review-deliverables')}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0D568D', backgroundColor: '#FFFFFF', color: '#0D568D', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Review &amp; Release
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>✓ Protected</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Pay Modal */}
      {payingPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Confirm Payment to Escrow
            </h3>
            <p style={{ fontSize: '14px', color: '#502419', lineHeight: 1.5, marginBottom: '16px' }}>
              You are funding the task <strong>{payingPayment.taskTitle}</strong> assigned to <strong>{payingPayment.gigProName}</strong>.
            </p>
            <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Work Agreed Amount:</span>
                <strong>{formatCurrency(payingPayment.gigAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Service Fee:</span>
                <strong>{formatCurrency(payingPayment.platformFee)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #DBDFDF', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                <span>Total Payable Now:</span>
                <span style={{ color: '#0D568D' }}>{formatCurrency(payingPayment.totalAmount)}</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#805C54', marginBottom: '20px', fontStyle: 'italic' }}>
              🛡️ Your payment will be securely held by the platform until the work is completed and approved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPayingPayment(null)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #DBDFDF', backgroundColor: '#FFFFFF', color: '#502419', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePayNow(payingPayment.paymentId)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#D47700', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Pay {formatCurrency(payingPayment.totalAmount)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalSpent;
