import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export default function ConfirmationDialog({
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  idPrefix,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  idPrefix: string;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  function trapKeys(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
    if (event.key === 'Tab') {
      if (event.shiftKey && event.target === cancel.current) {
        event.preventDefault();
        confirm.current?.focus();
      } else if (!event.shiftKey && event.target === confirm.current) {
        event.preventDefault();
        cancel.current?.focus();
      }
    }
  }
  return (
    <div className="dialog-overlay">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${idPrefix}-title`}
        aria-describedby={`${idPrefix}-description`}
        className="confirm-dialog"
        onKeyDown={trapKeys}
      >
        <h2 id={`${idPrefix}-title`}>{title}</h2>
        <p id={`${idPrefix}-description`}>{description}</p>
        <div className="result-actions">
          <button
            autoFocus
            ref={cancel}
            className="button-link"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirm}
            className="button-link result-wrong"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
