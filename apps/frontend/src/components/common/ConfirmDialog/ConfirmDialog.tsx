import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { FormActions } from '../forms/FormActions/FormActions';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Are you sure?" modal with Cancel / Confirm buttons. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, onConfirm, onCancel }) =>
  <Modal open={open} title={title} onClose={onCancel}>
    {message && <p>{message}</p>}
    <FormActions>
      <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </FormActions>
  </Modal>;

export default ConfirmDialog;
