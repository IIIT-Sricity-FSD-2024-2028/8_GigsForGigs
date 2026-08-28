import React, { useState } from 'react';
import { useClient } from '../../../context/ClientContext';

export interface TotalSpentProps {
  onNavigate: (viewId: string) => void;
}

export const TotalSpent: React.FC<TotalSpentProps> = () => {
  const { contracts, tasks } = useClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculations. There is no payment-ledger endpoint exposed to clients on
  // the backend, so "spent" is approximated as the sum of completed tasks'
  // budgets — no fabricated base amount is added on top.
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const activeContractsCount = contracts.filter(c => c.status === 'IN_PROGRESS').length;

  const completedSpent = completedTasks.reduce((sum, t) => sum + t.budget, 0);
  const totalSpent = completedSpent;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // The backend exposes no payment/transaction-history endpoint for
  // clients (client.service.ts has no ledger query) — "recent transactions"
  // is approximated from the real contracts list (derived from accepted
  // applications) rather than kept as a fully invented mock array.
  const transactionList = contracts.map(c => ({
    name: c.task_title,
    pro: c.gig_pro_name,
    amount: c.budget,
    date: c.createdAt,
    status: c.status,
  }));

  const filteredTransactions = transactionList.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.pro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 className="page-title">Total Spent</h1>
      </div>

      <section className="spent-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        
        {/* Spend Hero */}
        <article className="spent-hero" style={{ background: 'var(--color-primary-dark)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl) var(--spacing-xl)', color: 'var(--color-white)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="spent-kicker" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: 'var(--spacing-xs)' }}>
              Total Expenditure
            </div>
            <div className="spent-total" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div className="spent-meta" style={{ display: 'flex', gap: 'var(--spacing-xl)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--spacing-md)' }}>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>This Month</div>
              <div className="value" style={{ fontWeight: 700 }}>{formatCurrency(completedSpent)}</div>
              <div className="sub" style={{ fontSize: '0.7rem', color: 'var(--color-secondary)' }}>+8.2% vs last month</div>
            </div>
            <div className="spent-meta-block">
              <div className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>Open Projects</div>
              <div className="value" style={{ fontWeight: 700 }}>{activeContractsCount} Active</div>
              <div className="sub" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Across active categories</div>
            </div>
          </div>
        </article>

        {/* Budget outlook */}
        <article className="spent-budget" style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="spent-budget-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Budget Outlook</h3>
            <span className="spent-pill" style={{ fontSize: '0.68rem', backgroundColor: 'rgba(191, 105, 0, 0.14)', color: 'var(--color-primary-blue)', fontWeight: 700, borderRadius: '999px', padding: '4px 8px', textTransform: 'uppercase' }}>
              Q4 Analysis
            </span>
          </div>
          
          {/*
            There is no "budget allocation" concept anywhere in the schema
            or client routes — this 650000 figure (and the "on track" copy
            below) is decorative mock content left in place intentionally,
            since there is no real data to back a quarterly-allocation
            widget. Flagged as a known gap in the task report.
          */}
          <div style={{ margin: 'var(--spacing-sm) 0' }}>
            <div className="spent-budget-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--spacing-xs)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span>Quarterly Allocated Budget</span>
              <strong style={{ color: 'var(--color-text-dark)', fontSize: '1.1rem' }}>{formatCurrency(650000)}</strong>
            </div>
            <div className="spent-progress" style={{ width: '100%', height: '10px', backgroundColor: 'rgba(8, 75, 131, 0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: 'var(--spacing-md)' }}>
              <span id="client-budget-usage-bar" style={{ display: 'block', height: '100%', width: `${Math.min(100, Math.round((totalSpent / 650000) * 100))}%`, borderRadius: 'inherit', background: 'linear-gradient(90deg, #bf6900 0%, #d6841b 100%)' }}></span>
            </div>
          </div>
          
          <p className="spent-budget-note" style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            You have used <strong style={{ color: 'var(--color-text-dark)' }}>{Math.round((totalSpent / 650000) * 100)}%</strong> of your allocated budget for this quarter. Based on current trends, you are <strong style={{ color: 'var(--color-secondary)' }}>on track</strong>.
          </p>
        </article>

      </section>

      {/* Spending Trends Chart */}
      <section className="dashboard-section" style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="spent-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Spending Trends</h2>
            <div className="spent-section-sub" style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>Monthly expenditure across all active contracts</div>
          </div>
          <select className="spent-select" aria-label="Select spending range" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}>
            <option>Last 6 Months</option>
            <option>Last 12 Months</option>
          </select>
        </div>
        <div className="spent-chart-box" style={{ height: '220px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(242, 248, 252, 0.35) 100%)' }}>
          {/* Custom CSS Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '35%', width: '35px', backgroundColor: 'var(--color-primary-dark)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Mar</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '55%', width: '35px', backgroundColor: 'var(--color-primary-dark)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Apr</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '40%', width: '35px', backgroundColor: 'var(--color-primary-dark)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>May</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '80%', width: '35px', backgroundColor: 'var(--color-primary-dark)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Jun</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '65%', width: '35px', backgroundColor: 'var(--color-primary-dark)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Jul</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ height: '90%', width: '35px', backgroundColor: 'var(--color-primary-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Aug</span>
          </div>
        </div>
      </section>

      {/* Recent Transactions Table */}
      <section className="spent-table-wrap" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-white)' }}>
        <div className="spent-table-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(8, 75, 131, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', fontWeight: 600 }}>Recent Transactions</h3>
          <div className="topbar-search" style={{ border: '1px solid var(--color-border)', background: 'var(--color-white)', padding: '4px 8px', borderRadius: '6px', width: '220px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        <table className="activity-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Professional</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t, idx) => (
              <tr key={idx}>
                <td><div className="task-name-cell">{t.name}</div></td>
                <td>{t.pro}</td>
                <td className="budget-cell">{formatCurrency(t.amount)}</td>
                <td>{t.date}</td>
                <td>
                  <span className={`status-badge ${
                    t.status === 'COMPLETED'
                      ? 'status-completed'
                      : t.status === 'REVIEWING'
                        ? 'status-review-needed'
                        : t.status === 'IN_PROGRESS'
                          ? 'status-in-progress'
                          : 'status-scheduled'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TotalSpent;
