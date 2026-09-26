"use client";

import { useRef } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useModKeyLabel } from "@/lib/platform";
import { CodeIcon, KeyIcon, TerminalIcon } from "../icons/BarIcons";
import { Logo } from "../Logo";
import { DialogCloseButton } from "./DialogCloseButton";
import { Point, Shortcut } from "./WelcomeParts";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddKey: () => void;
};

export function WelcomeDialog({ open, onClose, onAddKey }: Props) {
  const startRef = useRef<HTMLButtonElement>(null);
  const { ref, close, onBackdropClick } = useModalDialog(open, (dialog) => {
    startRef.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    dialog.scrollTop = 0;
  });
  const mod = useModKeyLabel();

  return (
    <dialog
      ref={ref}
      className="dialog dialog-welcome"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-intro"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className="dialog-body">
        <header className="welcome-header">
          <Logo size={48} />
          <div>
            <h2 id="welcome-title" className="dialog-title welcome-title">
              Welcome to Plus Compiler
            </h2>
            <p id="welcome-intro" className="welcome-intro">
              Write code and run it, right in your browser.
            </p>
          </div>
        </header>

        <ul className="welcome-points">
          <Point icon={<CodeIcon size={20} />}>
            <strong>HTML, CSS and JavaScript</strong> open in a new tab.
          </Point>
          <Point icon={<TerminalIcon size={20} />}>
            <strong>C and Rust</strong> are run by AI. Results are usually right, but not always.
          </Point>
          <Point icon={<KeyIcon size={20} />}>
            To run C and Rust, <strong>add your own API key</strong>.
          </Point>
        </ul>

        <div className="welcome-shortcuts" aria-label="Shortcuts">
          <Shortcut keys={[mod, "Enter"]} label="Run" />
          <Shortcut keys={[mod, "E"]} label="Toolbar" />
          <Shortcut keys={[mod, "J"]} label="Terminal" />
        </div>

        <p className="welcome-tip">Hover over the icons on the right to see what they do. The ? icon opens this again.</p>

        <div className="welcome-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              close();
              onAddKey();
            }}
          >
            Add API key
          </button>
          <button ref={startRef} type="button" className="btn btn-primary" onClick={close}>
            Start coding
          </button>
        </div>

        <DialogCloseButton onClick={close} />
      </div>
    </dialog>
  );
}
