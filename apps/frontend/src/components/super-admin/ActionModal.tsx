import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

/**
 * @file ActionModal.tsx
 * @description
 * Accessible, customizable modal and drawer container for administrative inspections,
 * invitations, and entity editing. Supports backdrop dismiss and Escape key traps.
 */

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  isDrawer?: boolean;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '540px',
  isDrawer = false
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 75, 131, 0.4)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isDrawer ? 'stretch' : 'center',
        justifyContent: isDrawer ? 'flex-end' : 'center',
        padding: isDrawer ? 0 : 'var(--spacing-md)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: isDrawer ? '100vh' : '90vh',
          height: isDrawer ? '100vh' : 'auto',
          borderRadius: isDrawer ? 'var(--radius-lg) 0 0 var(--radius-lg)' : 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg-white)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: 'var(--color-bg-white)'
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'rgba(8, 75, 131, 0.02)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
