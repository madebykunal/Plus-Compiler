import type { ReactNode } from "react";

export function Point({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="welcome-point">
      <span className="welcome-point-icon">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="welcome-shortcut">
      <span className="welcome-keys">
        {keys.map((key) => (
          <kbd key={key}>{key}</kbd>
        ))}
      </span>
      {label}
    </span>
  );
}
