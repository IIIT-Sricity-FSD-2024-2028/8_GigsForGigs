import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';
import { PAYMENT_STATUS_UI } from '../../../utils/helpers/paymentStatus';
import { FundTaskCard } from '../../../components/client/cards/FundTaskCard';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/common/Table';

export interface TotalSpentProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

export const TotalSpent: React.FC<TotalSpentProps> = ({ onNavigate }) => {
  const { contracts } = useClient();
  const [searchTerm, setSearchTerm] = useState('');

  const clientPayments = contracts.filter(c => c.payment_status);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalSpent = clientPayments
    .filter(c => c.payment_status === 'completed')
    .reduce((sum, c) => sum + c.total_amount, 0);

  const escrowLockedTotal = clientPayments
    .filter(c => c.payment_status === 'held')
    .reduce((sum, c) => sum + c.total_amount, 0);

  const filteredPayments = clientPayments.filter(c =>
    c.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gig_pro_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Client Payments & Escrow Ledger" description="Track task payments, platform fees, and escrow statuses securely." />

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
              Total Payable = Gig Agreed Amount + 10% Platform Fee
            </div>
          </div>
        </article>
      </section>

      {clientPayments.filter(c => c.payment_status === 'pending').map(c => (
        <FundTaskCard key={c.task_id} contract={c} />
      ))}

      {/* Escrow Payments Table */}
      <section className="spent-table-wrap" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-white)' }}>
        <div className="spent-table-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(8, 75, 131, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Task Payment Ledger</h3>
          <div className="topbar-search" style={{ border: '1px solid var(--color-border)', background: 'var(--color-white)', padding: '4px 8px', borderRadius: '6px', width: '240px', display: 'flex', alignItems: 'center' }}>
            <input maxLength={100}
              type="text"
              placeholder="Filter payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        <Table className="activity-table">
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
              filteredPayments.map(c => {
                const ps = PAYMENT_STATUS_UI[c.payment_status!];
                return (
                <tr key={c.task_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{c.task_title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>PAY-{c.payment_id}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{c.gig_pro_name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(c.budget)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>+{formatCurrency(c.platform_fee)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0D568D' }}>{formatCurrency(c.total_amount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, backgroundColor: ps.bg, color: ps.fg }}>
                      {ps.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {c.payment_status === 'held' ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('review-deliverables', { taskId: c.task_id })}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0D568D', backgroundColor: '#FFFFFF', color: '#0D568D', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Review &amp; Release
                      </button>
                    ) : c.payment_status === 'pending' ? (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pay above to start</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </section>

    </div>
  );
};

export default TotalSpent;
