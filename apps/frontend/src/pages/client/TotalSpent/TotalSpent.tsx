import React, { useState, useEffect, useCallback } from 'react';
import { useClient } from '../../../context/ClientContext';
import { usePayments, type EscrowPayment } from '../../../context/PaymentContext/PaymentContext';
import clientApi from '../../../services/api/client/clientApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/common/Table';
import { Loader } from '../../../components/common/Loader';

export interface TotalSpentProps {
  onNavigate: (viewId: string, params?: Record<string, string>) => void;
}

type StatusFilterType = 'ALL' | 'COMPLETED' | 'ESCROWED' | 'AWAITING_APPROVAL' | 'PENDING';

export const TotalSpent: React.FC<TotalSpentProps> = ({ onNavigate }) => {
  const { contracts, tasks } = useClient();
  const { payments: contextPayments, confirmEscrowPayment } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [payingPayment, setPayingPayment] = useState<EscrowPayment | null>(null);
  const [dbPayments, setDbPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientApi.getPayments();
      setDbPayments(res || []);
    } catch (err) {
      console.error('Failed to load client payments:', err);
      setDbPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Merge loaded database payments with any live context updates and ensure any completed tasks are represented
  const existingTaskIds = new Set(dbPayments.map((p) => String(p.taskId)));
  const fallbackCompletedPayments: EscrowPayment[] = tasks
    .filter((t) => t.status === 'COMPLETED' && !existingTaskIds.has(String(t.task_id)))
    .map((t) => {
      const gigAmount = Number(t.budget) || 0;
      const platformFee = Math.round(gigAmount * 0.07);
      const totalAmount = gigAmount + platformFee;
      const contract = contracts.find((c) => String(c.task_id) === String(t.task_id));
      return {
        paymentId: `PAY-TASK-${t.task_id}`,
        taskId: String(t.task_id),
        taskTitle: t.title || `Task #${t.task_id}`,
        gigProfileId: contract?.contract_id || '0',
        gigProName: contract?.gig_pro_name || 'Assigned Professional',
        gigAmount,
        platformFee,
        totalAmount,
        status: 'COMPLETED' as const,
        createdAt: t.createdAt || new Date().toISOString(),
      };
    });

  const mergedPayments = [...dbPayments, ...fallbackCompletedPayments];

  const clientPayments = mergedPayments.map((p) => {
    const ctx = contextPayments.find((cp) => cp.paymentId === p.paymentId || String(cp.taskId) === String(p.taskId));
    return ctx && ctx.status !== 'PENDING' ? { ...p, status: ctx.status } : p;
  });

  // 1. Total Spent: Sum of the costs of all completed projects using existing project cost fields (budget) from actual DB records
  const completedContracts = contracts.filter(
    (c) => c.status === 'COMPLETED' || tasks.find((t) => t.task_id === c.task_id)?.status === 'COMPLETED'
  );
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const completedProjectMap = new Map<string, number>();

  completedContracts.forEach((c) => {
    completedProjectMap.set(String(c.task_id), Number(c.budget) || 0);
  });

  completedTasks.forEach((t) => {
    if (!completedProjectMap.has(String(t.task_id))) {
      completedProjectMap.set(String(t.task_id), Number(t.budget) || 0);
    }
  });

  const completedProjectsCost = Array.from(completedProjectMap.values()).reduce((sum, cost) => sum + cost, 0);

  // Fallback to payments if contracts/tasks list is not yet populated
  const completedPaymentsCost = clientPayments
    .filter((p) => p.status === 'COMPLETED' || p.status === 'RELEASED')
    .reduce((sum, p) => sum + (p.gigAmount || 0), 0);

  const totalSpent = completedProjectMap.size > 0 ? completedProjectsCost : completedPaymentsCost;
  const completedProjectsCount = completedProjectMap.size > 0
    ? completedProjectMap.size
    : clientPayments.filter((p) => p.status === 'COMPLETED' || p.status === 'RELEASED').length;

  // 2. Funds Held in Escrow: Calculated separately according to existing escrow records and platform rules
  // (ESCROWED, WORK_SUBMITTED, AWAITING_APPROVAL, DISPUTED) — excludes PENDING (unfunded) and COMPLETED/RELEASED
  const escrowLockedTotal = clientPayments
    .filter(
      (p) =>
        p.status === 'ESCROWED' ||
        p.status === 'WORK_SUBMITTED' ||
        p.status === 'AWAITING_APPROVAL' ||
        p.status === 'DISPUTED'
    )
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  // Active task contracts count (excluding completed)
  const activeContractsCount = contracts.filter(
    (c) => c.status !== 'COMPLETED' && tasks.find((t) => t.task_id === c.task_id)?.status !== 'COMPLETED'
  ).length;

  // Filtered Payments based on status dropdown and keyword search
  const filteredPayments = clientPayments.filter((p) => {
    // Status Filter
    if (statusFilter === 'COMPLETED') {
      if (p.status !== 'COMPLETED' && p.status !== 'RELEASED') return false;
    } else if (statusFilter === 'ESCROWED') {
      if (p.status !== 'ESCROWED') return false;
    } else if (statusFilter === 'AWAITING_APPROVAL') {
      if (p.status !== 'WORK_SUBMITTED' && p.status !== 'AWAITING_APPROVAL') return false;
    } else if (statusFilter === 'PENDING') {
      if (p.status !== 'PENDING' && p.status !== 'FAILED') return false;
    }

    // Keyword Search
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const matchesTitle = (p.taskTitle || '').toLowerCase().includes(term);
    const matchesPro = (p.gigProName || '').toLowerCase().includes(term);
    const matchesId = (p.paymentId || '').toLowerCase().includes(term);
    const matchesStatus = (p.status || '').toLowerCase().includes(term);
    const matchesTaskNum = String(p.taskId || '').includes(term);

    return matchesTitle || matchesPro || matchesId || matchesStatus || matchesTaskNum;
  });

  const handlePayNow = async (payment: EscrowPayment) => {
    try {
      await confirmEscrowPayment(payment.paymentId);
      setPayingPayment(null);
      alert(`Payment successful! ${formatCurrency(payment.totalAmount)} has been securely locked in escrow until work approval.`);
      await loadPayments();
    } catch (err) {
      console.error('Error confirming escrow payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  const renderStatusBadge = (status: string) => {
    let bg = '#F1F3F4';
    let color = '#5F6368';
    let border = '#DADCE0';
    let label = status.replace(/_/g, ' ');

    if (status === 'COMPLETED' || status === 'RELEASED') {
      bg = '#E6F4EA';
      color = '#137333';
      border = '#CEEAD6';
      label = 'Payment Completed';
    } else if (status === 'ESCROWED') {
      bg = '#E8F0FE';
      color = '#1A73E8';
      border = '#D2E3FC';
      label = 'Funds Secured';
    } else if (status === 'WORK_SUBMITTED' || status === 'AWAITING_APPROVAL') {
      bg = '#FEF7E0';
      color = '#B06000';
      border = '#FEEFC3';
      label = 'Awaiting Approval';
    } else if (status === 'PENDING') {
      bg = '#FFF0E6';
      color = '#D47700';
      border = '#FFE0B2';
      label = 'Payment Required';
    } else if (status === 'FAILED') {
      bg = '#FCE8E6';
      color = '#C5221F';
      border = '#FAD2CF';
      label = 'Payment Failed';
    } else if (status === 'DISPUTED') {
      bg = '#FEEFC3';
      color = '#B06000';
      border = '#FDD663';
      label = 'Disputed';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div>
      <PageHeader
        title="Client Payments & Escrow Ledger"
        description="Track task payments, platform fees, and escrow statuses securely."
      />

      <section
        className="spent-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Spend Hero */}
        <article
          className="spent-hero"
          style={{
            background: 'var(--color-primary-dark)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-white)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0
          }}
        >
          <div>
            <div
              className="spent-kicker"
              style={{
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.8,
                marginBottom: 'var(--spacing-xs)'
              }}
            >
              Total Completed Projects Spend
            </div>
            <div
              className="spent-total"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: 'var(--spacing-md)'
              }}
            >
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div
            className="spent-meta"
            style={{
              display: 'flex',
              gap: 'var(--spacing-xl)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 'var(--spacing-md)',
              flexWrap: 'wrap'
            }}
          >
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Funds Held in Escrow
              </div>
              <div className="value" style={{ fontWeight: 700, color: '#FDE68A' }}>
                {formatCurrency(escrowLockedTotal)}
              </div>
              <div className="sub" style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>
                Secured by Platform
              </div>
            </div>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Completed Projects
              </div>
              <div className="value" style={{ fontWeight: 700 }}>
                {completedProjectsCount} Projects
              </div>
              <div className="sub" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                Finished &amp; Approved
              </div>
            </div>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Active Task Contracts
              </div>
              <div className="value" style={{ fontWeight: 700 }}>
                {activeContractsCount} Tasks
              </div>
              <div className="sub" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                Across verified professionals
              </div>
            </div>
          </div>
        </article>

        {/* Payment Model Guarantee Card */}
        <article
          className="spent-budget"
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0D568D', fontWeight: 700, marginBottom: '8px' }}>
              🛡️ Escrow Protection Guarantee
            </h3>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                marginBottom: '16px'
              }}
            >
              Your money is protected. When you fund a task, your payment is held securely in escrow and only released
              after you inspect and approve the completed deliverable.
            </p>
          </div>
          <div style={{ backgroundColor: '#F0F6F6', borderRadius: '8px', padding: '12px', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 600, color: '#0D568D', marginBottom: '4px' }}>Payment Calculation Rule:</div>
            <div style={{ color: '#502419' }}>
              Total Payable = Gig Agreed Amount + 7% Platform Fee
            </div>
          </div>
        </article>
      </section>

      {clientPayments.filter(c => c.payment_status === 'pending').map(c => (
        <FundTaskCard key={c.task_id} contract={c} />
      ))}

      {/* Escrow Payments Table */}
      {loading ? (
        <Loader label="Loading client payment ledger from PostgreSQL..." />
      ) : (
        <section
          className="spent-table-wrap"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
            backgroundColor: 'var(--color-white)',
            width: '100%',
            minWidth: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          {/* Header & Filter Toolbar */}
          <div
            className="spent-table-head"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'rgba(8, 75, 131, 0.03)',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', fontWeight: 600, margin: 0 }}>
                Task Payment Ledger
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {clientPayments.length === 0
                  ? 'No records'
                  : `Showing ${filteredPayments.length} of ${clientPayments.length} recorded payments`}
              </span>
            </div>

            {/* Filter and Search controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-dark)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                aria-label="Filter by payment status"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed / Released</option>
                <option value="ESCROWED">Funds Secured in Escrow</option>
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="PENDING">Payment Required</option>
              </select>

              {/* Text Search Input */}
              <div
                className="topbar-search"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-white)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  width: '230px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  maxLength={100}
                  type="text"
                  placeholder="Filter by title, pro, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.82rem',
                    background: 'transparent'
                  }}
                  aria-label="Search payment records"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      padding: '0 2px'
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Clear / Reset Filters */}
              {(searchTerm || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#084B83',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px 6px'
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <Table className="activity-table" style={{ minWidth: '780px', width: '100%' }}>
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
              {/* Empty state: No records in DB at all */}
              {clientPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 24px' }}>
                    <div
                      style={{
                        maxWidth: '420px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ fontSize: '2rem' }}>💳</div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: 0 }}>
                        No payment records found
                      </h4>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--color-text-muted)',
                          margin: 0,
                          lineHeight: 1.5
                        }}
                      >
                        You have not funded or initiated any tasks yet. Once you accept a proposal and fund escrow or complete a task, transactions will appear here.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('my-gigs')}
                        style={{
                          marginTop: '8px',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: '1px solid #084B83',
                          backgroundColor: '#FFFFFF',
                          color: '#084B83',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        View Active Tasks &amp; Contracts
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                /* Empty state: Filters produced 0 matching records */
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 24px' }}>
                    <div
                      style={{
                        maxWidth: '380px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem' }}>🔍</div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-dark)', margin: 0 }}>
                        No payments match your filter
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        Try searching for a different keyword or resetting your status filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#084B83',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Payment rows */
                filteredPayments.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* Payment / Task */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>
                        {p.taskTitle || `Task #${p.taskId}`}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px',
                          fontSize: '11px',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        <span style={{ fontFamily: 'monospace' }}>{p.paymentId}</span>
                        {p.createdAt && <span>• {formatDate(p.createdAt)}</span>}
                      </div>
                    </td>

                    {/* Gig Professional */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#EBF4F6',
                            color: '#084B83',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(p.gigProName)}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-dark)' }}>
                          {p.gigProName || 'Assigned Professional'}
                        </span>
                      </div>
                    </td>

                    {/* Gig Amount */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(p.gigAmount)}
                    </td>

                    {/* Platform Fee */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      <div>+{formatCurrency(p.platformFee)}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>7% fee</div>
                    </td>

                    {/* Total Paid */}
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#0D568D',
                        fontSize: '0.95rem'
                      }}
                    >
                      {formatCurrency(p.totalAmount)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {renderStatusBadge(p.status)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {p.status === 'PENDING' || p.status === 'FAILED' ? (
                        <button
                          type="button"
                          onClick={() => setPayingPayment(p)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#D47700',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Pay {formatCurrency(p.totalAmount)}
                        </button>
                      ) : p.status === 'WORK_SUBMITTED' || p.status === 'AWAITING_APPROVAL' ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('review-deliverables')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #0D568D',
                            backgroundColor: '#FFFFFF',
                            color: '#0D568D',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Review &amp; Release
                        </button>
                      ) : p.status === 'COMPLETED' || p.status === 'RELEASED' ? (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#137333',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ✓ Released
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#1A73E8',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ✓ Escrow Secured
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </section>
      )}

      {/* Pay Modal */}
      {payingPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0D568D', margin: '0 0 12px 0' }}>
              Confirm Payment to Escrow
            </h3>
            <p style={{ fontSize: '14px', color: '#502419', lineHeight: 1.5, marginBottom: '16px' }}>
              You are funding the task <strong>{payingPayment.taskTitle}</strong> assigned to{' '}
              <strong>{payingPayment.gigProName}</strong>.
            </p>
            <div
              style={{
                backgroundColor: '#F0F6F6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Work Agreed Amount:</span>
                <strong>{formatCurrency(payingPayment.gigAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Service Fee (7%):</span>
                <strong>{formatCurrency(payingPayment.platformFee)}</strong>
              </div>
              <div
                style={{
                  borderTop: '1px solid #DBDFDF',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '15px'
                }}
              >
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
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #DBDFDF',
                  backgroundColor: '#FFFFFF',
                  color: '#502419',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePayNow(payingPayment)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#D47700',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
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
