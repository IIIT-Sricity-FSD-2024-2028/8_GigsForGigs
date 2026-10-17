import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  labelledBy?: string;
}

/** Accessible popup dialog rendered into <body> via a portal. Closes on Escape, backdrop click (optional) or the × button, and keeps keyboard focus inside while open. */
export const Modal: React.FC<ModalProps> = ({ open, isOpen, onClose, title, children, className = '', closeOnOverlayClick = true, labelledBy }) => {
  // Both `open` and `isOpen` are accepted (older pages use isOpen).
  const visible = open ?? isOpen ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visible) return;
    // Remember what had focus so it can be restored on close, then focus the dialog.
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
      // Focus trap: Tab / Shift+Tab wrap around inside the dialog instead of leaving it.
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'));
        if (focusable.length === 0) { event.preventDefault(); dialogRef.current.focus(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [visible, onClose]);
  if (!visible) return null;
  const titleId = labelledBy || (title ? `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return createPortal(
    // Clicking the dark backdrop itself (not the dialog) closes it.
    <div className="ui-modal-backdrop" onMouseDown={(event) => { if (closeOnOverlayClick && event.target === event.currentTarget) onClose?.(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-label={!titleId ? 'Dialog' : undefined} tabIndex={-1} className={`ui-modal ${className}`.trim()}>
        {(title || onClose) && <header className="ui-modal__header">{title && <h2 id={titleId}>{title}</h2>}{onClose && <button type="button" className="ui-modal__close" onClick={onClose} aria-label="Close dialog">×</button>}</header>}
        {children}
      </div>
    </div>, document.body
  );
};

export default Modal;
