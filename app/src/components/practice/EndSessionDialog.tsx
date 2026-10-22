import ConfirmationDialog from '../layout/ConfirmationDialog';

export default function EndSessionDialog(props: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      {...props}
      idPrefix="end"
      title="End this session?"
      description="Your answered questions will be included in your recap. This unfinished card won’t count."
      cancelLabel="Keep practicing"
      confirmLabel="End session now"
    />
  );
}
