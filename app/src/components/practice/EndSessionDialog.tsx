import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export default function EndSessionDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
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
        aria-labelledby="end-title"
        aria-describedby="end-description"
        className="confirm-dialog"
        onKeyDown={trapKeys}
      >
        <h2 id="end-title">End this session?</h2>
        <p id="end-description">
          Your answered questions will be included in your recap. This
          unfinished card won’t count.
        </p>
        <div className="result-actions">
          <button
            autoFocus
            ref={cancel}
            className="button-link"
            onClick={onCancel}
            type="button"
          >
            Keep practicing
          </button>
          <button
            ref={confirm}
            className="button-link result-wrong"
            onClick={onConfirm}
            type="button"
          >
            End session now
          </button>
        </div>
      </section>
    </div>
  );
}
