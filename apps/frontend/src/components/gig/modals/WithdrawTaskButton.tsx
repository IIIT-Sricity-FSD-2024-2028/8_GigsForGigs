import React, { useState } from 'react';
import gigApi from '../../../services/api/gig/gigApi';
import { ApiError } from '../../../services/api/httpClient';
import { Button, ConfirmDialog, useToast } from '../../common';

interface WithdrawTaskButtonProps {
  taskId: number;
  title: string;
  /** Called after the withdrawal succeeded, so the page can leave/refresh. */
  onWithdrawn: () => void;
  style?: React.CSSProperties;
}

/** "Withdraw from task" with a confirmation. Render it only while no deliverable has been submitted; the API enforces that too. */
export const WithdrawTaskButton: React.FC<WithdrawTaskButtonProps> = ({ taskId, title, onWithdrawn, style }) => {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await gigApi.withdrawFromTask(taskId);
      toast.success('You have withdrawn from this task.');
      setOpen(false);
      onWithdrawn();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not withdraw from this task.');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)} style={style}>Withdraw from Task</Button>
      <ConfirmDialog
        open={open}
        danger
        loading={busy}
        title="Withdraw from task"
        message={`Withdraw from "${title}"? You will be removed from this task and it leaves your Active Tasks. The client can hire another professional. You cannot re-apply to this task, and withdrawal is only possible before you submit any deliverable.`}
        confirmLabel="Withdraw"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export default WithdrawTaskButton;
