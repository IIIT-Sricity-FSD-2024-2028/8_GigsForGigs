import React, { useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button, useToast } from '../../common';
import { copyInviteLink } from '../../../utils/shareInviteLink';

export interface InviteLinkModalProps {
  link: string;
  onClose: () => void;
}

/** Shows a manager's one-time activation link in a copyable card; copies it to the clipboard as soon as it opens. */
export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ link, onClose }) => {
  const toast = useToast();

  useEffect(() => {
    copyInviteLink(link);
    toast.success('Invite link copied to clipboard!');
    // Only run once per link, when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  return (
    <Modal open title="Manager invite link" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Share this one-time activation link with your manager so they can set up their account.
        </p>

        <div
          style={{
            backgroundColor: 'var(--color-bg-light, #F5F9FA)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            color: 'var(--color-text-dark)',
            wordBreak: 'break-all',
          }}
        >
          {link}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="outline" type="button" onClick={() => { copyInviteLink(link); toast.success('Invite link copied to clipboard!'); }}>
            Copy Link
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InviteLinkModal;
