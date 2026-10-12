import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, isOpen, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false, onConfirm, onCancel, children, className = '' }) =>
  <Modal open={open ?? isOpen} title={title} onClose={onCancel} className={`ui-confirm-dialog ${className}`.trim()}>
    {message && <p className="ui-confirm-dialog__message">{message}</p>}{children}
    <div className="ui-confirm-dialog__actions">
      <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={destructive ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>;

export default ConfirmDialog;
