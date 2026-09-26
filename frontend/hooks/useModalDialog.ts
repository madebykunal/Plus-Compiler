import { useCallback, useEffect, useRef, type MouseEvent } from "react";

export function useModalDialog(open: boolean, onShow?: (dialog: HTMLDialogElement) => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      onShow?.(dialog);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = useCallback(() => ref.current?.close(), []);

  const onBackdropClick = useCallback((e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  }, []);

  return { ref, close, onBackdropClick };
}
