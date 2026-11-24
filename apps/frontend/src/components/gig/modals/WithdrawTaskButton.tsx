import React, { useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { rejectionMessage, withdrawFromTask } from '../../../store/gig/gigSlice';
import { Button, ConfirmDialog, useToast } from '../../common';

interface WithdrawTaskButtonProps {
  taskId: number;
  title: string;
  /** Called after the withdrawal succeeded, so the page can leave/refresh. */
  onWithdrawn?: () => void;
  style?: React.CSSProperties;
}

/** "Withdraw from task" with a confirmation. Render it only while no deliverable has been submitted; the API enforces that too. */
export const WithdrawTaskButton: React.FC<WithdrawTaskButtonProps> = ({ taskId, title, onWithdrawn, style }) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await dispatch(withdrawFromTask(taskId)).unwrap();
      toast.success('You have withdrawn from this task.');
      setOpen(false);
      onWithdrawn?.();
    } catch (err) {
      toast.error(rejectionMessage(err, 'Could not withdraw from this task.'));
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
