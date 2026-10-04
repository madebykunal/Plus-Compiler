"use client";

import { useModalDialog } from "@/hooks/useModalDialog";
import { DialogCloseButton } from "./DialogCloseButton";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ColdStartDialog({ open, onClose }: Props) {
  const { ref, close, onBackdropClick } = useModalDialog(open);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="cold-start-title"
      aria-describedby="cold-start-description"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className="dialog-body">
        <h2 id="cold-start-title" className="dialog-title">
          Key saved
        </h2>
        <p id="cold-start-description" className="dialog-text">
          Your first run may take up to a minute. The server is on Render&apos;s free plan and sleeps when idle. After
          it wakes up, runs are quick.
        </p>

        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={close}>
            Got it
          </button>
        </div>

        <DialogCloseButton onClick={close} />
      </div>
    </dialog>
  );
}
