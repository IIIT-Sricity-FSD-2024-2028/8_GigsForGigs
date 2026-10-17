import React, { useState } from 'react';
import { useClient, type Contract } from '../../../../context/ClientContext';

const inr = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

/** Simulated checkout: the client pays gig amount + platform fee into escrow after hiring. */
export const FundTaskCard: React.FC<{ contract: Contract; onPaid?: () => void }> = ({ contract, onPaid }) => {
  const { payTask } = useClient();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    setPaying(true);
    setError('');
    try {
      await payTask(contract.task_id);
      onPaid?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <article style={{ border: '1px solid #D47700', borderRadius: '12px', padding: '20px', background: '#FFF8EE', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 4px', color: '#0D568D', fontSize: '1.05rem', fontWeight: 700 }}>
        Fund “{contract.task_title}” to start work
      </h3>
      <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#502419' }}>
        {contract.gig_pro_name} can start once you pay. The platform holds the money until you release it after approving all deliverables.
      </p>
      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gig amount</span><strong>{inr(contract.budget)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Platform fee (10%)</span><strong>{inr(contract.platform_fee)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #DBDFDF', marginTop: '6px', paddingTop: '6px', fontWeight: 700 }}>
          <span>Total payable now</span><span style={{ color: '#0D568D' }}>{inr(contract.total_amount)}</span>
        </div>
      </div>
      {error && <p role="alert" style={{ color: '#B42318', fontSize: '0.8rem', margin: '0 0 8px' }}>{error}</p>}
      <button
        type="button"
        onClick={pay}
        disabled={paying}
        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#D47700', color: '#fff', fontWeight: 700, cursor: paying ? 'wait' : 'pointer' }}
      >
        {paying ? 'Processing…' : `Pay ${inr(contract.total_amount)}`}
      </button>
    </article>
  );
};
export default FundTaskCard;
