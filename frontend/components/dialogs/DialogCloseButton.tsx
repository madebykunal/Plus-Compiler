import { CloseIcon } from "../icons/UiIcons";

export function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="dialog-close" onClick={onClick} aria-label="Close">
      <CloseIcon />
    </button>
  );
}
