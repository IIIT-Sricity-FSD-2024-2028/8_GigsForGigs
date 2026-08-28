import React from 'react';
import { ActionModal } from './ActionModal';
import { DisputeIcon } from './Icons';

/**
 * @file ConfirmDialog.tsx
 * @description
 * High-stakes confirmation prompt for destructive or governance actions
 * (e.g., Banning users, Revoking admin tokens, Forcing dispute settlements).
 */

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isDanger = false,
  isLoading = false
}) => {
  const handleClose = onClose || onCancel || (() => {});
  const isDestructive = isDangerous || isDanger;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      width="440px"
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`admin-btn ${isDestructive ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isDestructive ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
            color: isDestructive ? 'var(--color-danger-text)' : 'var(--color-warning-text)'
          }}
        >
          <DisputeIcon size={24} />
        </div>
        <div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)', lineHeight: 1.5 }}>
            {message}
          </p>
          {isDangerous && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-text)', fontWeight: 600, marginTop: '8px' }}>
              Warning: This administrative action is permanent and recorded in audit logs.
            </p>
          )}
        </div>
      </div>
    </ActionModal>
  );
};
