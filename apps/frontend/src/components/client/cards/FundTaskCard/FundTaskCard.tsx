import React, { useState } from 'react';
import type { Contract } from '../../../../types/client';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { payEscrowTask } from '../../../../store/payment/paymentSlice';
import { selectClientPayRequest } from '../../../../store/payment/selectors';
import { fetchClientContracts, fetchClientTasks } from '../../../../store/client/clientSlice';
import { formatCurrency } from '../../../../utils/format';
import { extractErrorMessage } from '../../../../utils/adminAccess';

/**
 * Simulated checkout: the client pays gig amount + platform fee into escrow after hiring.
 * Shown on a contract whose payment is still pending. `onPaid` lets the parent refresh/close.
 */
export const FundTaskCard: React.FC<{ contract: Contract; onPaid?: () => void }> = ({ contract, onPaid }) => {
  const dispatch = useAppDispatch();
  const payRequest = useAppSelector(selectClientPayRequest);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const isBusy = paying || payRequest.status === 'loading';

  const pay = async () => {
    setPaying(true);
    setError('');
    try {
      await dispatch(
        payEscrowTask({
          taskId: Number(contract.task_id),
          gigProfileId: Number(contract.gig_profile_id),
        }),
      ).unwrap();
      void dispatch(fetchClientContracts());
      void dispatch(fetchClientTasks());
      onPaid?.();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Payment failed. Please try again.'));
      setPaying(false);
    }
    // On success `paying` stays true: the card is replaced once the contract refreshes.
  };

  return (
    <article style={{ border: '1px solid #B45F00', borderRadius: '12px', padding: '20px', background: '#FFF8EE', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 4px', color: '#0D568D', fontSize: '1.05rem', fontWeight: 700 }}>
        Fund “{contract.task_title}” to start work
      </h3>
      <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#1B2A36' }}>
        {contract.gig_pro_name} can start once you pay. The platform holds the money until you release it after approving all deliverables.
      </p>
      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gig amount</span><strong>{formatCurrency(contract.budget)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Platform fee</span><strong>{formatCurrency(contract.platform_fee)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #DCE3E8', marginTop: '6px', paddingTop: '6px', fontWeight: 700 }}>
          <span>Total payable now</span><span style={{ color: '#0D568D' }}>{formatCurrency(contract.total_amount)}</span>
        </div>
      </div>
      {error && <p role="alert" style={{ color: '#B42318', fontSize: '0.8rem', margin: '0 0 8px' }}>{error}</p>}
      <button
        type="button"
        onClick={pay}
        disabled={isBusy}
        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#B45F00', color: '#fff', fontWeight: 700, cursor: isBusy ? 'wait' : 'pointer', opacity: isBusy ? 0.7 : 1 }}
      >
        {isBusy ? 'Processing…' : `Pay ${formatCurrency(contract.total_amount)}`}
      </button>
    </article>
  );
};
export default FundTaskCard;
