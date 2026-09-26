import type { MouseEvent, ReactNode } from "react";

type Props = {
  label: string;
  shortcut?: string;
  className?: string;
  active?: boolean;
  pressed?: boolean;
  haspopup?: boolean;
  disabled?: boolean;
  link?: { href: string; target: string; resolve: () => string };
  onClick?: () => void;
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
  link,
  onClick,
  children,
}: Props) {
  const shared = {
    className: className ? `activity-btn ${className}` : "activity-btn",
    "data-active": active || undefined,
    "data-tooltip": shortcut ? `${label}  ·  ${shortcut}` : label,
    "aria-label": label,
    "aria-disabled": disabled || undefined,
  };

  if (link) {
    const follow = (e: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      e.currentTarget.href = link.resolve();
    };
    return (
      <a {...shared} href={link.href} target={link.target} onClick={follow} onAuxClick={follow}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      {...shared}
      aria-pressed={pressed}
      aria-haspopup={haspopup ? "dialog" : undefined}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
    >
      {children}
    </button>
  );
}
