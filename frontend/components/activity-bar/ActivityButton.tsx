import type { ReactNode } from "react";

type Props = {
  label: string;
  shortcut?: string;
  className?: string;
  active?: boolean;
  pressed?: boolean;
  haspopup?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function ActivityButton({
  label,
  shortcut,
  className,
  active,
  pressed,
  haspopup,
  disabled,
  onClick,
  children,
}: Props) {
  return (
    <button
      type="button"
      className={className ? `activity-btn ${className}` : "activity-btn"}
      data-active={active || undefined}
      data-tooltip={shortcut ? `${label}  ·  ${shortcut}` : label}
      aria-label={label}
      aria-pressed={pressed}
      aria-haspopup={haspopup ? "dialog" : undefined}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      {children}
    </button>
  );
}
