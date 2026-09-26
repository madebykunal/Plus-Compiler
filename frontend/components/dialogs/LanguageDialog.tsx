"use client";

import type { KeyboardEvent } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";
import { LANGUAGES, type LanguageId } from "@/lib/languages";
import { CheckIcon } from "../icons/UiIcons";
import { DialogCloseButton } from "./DialogCloseButton";

type Props = {
  open: boolean;
  value: LanguageId;
  onChange: (id: LanguageId) => void;
  onClose: () => void;
};

const focusCurrent = (dialog: HTMLDialogElement) =>
  dialog.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();

export function LanguageDialog({ open, value, onChange, onClose }: Props) {
  const { ref, close, onBackdropClick } = useModalDialog(open, focusCurrent);

  const choose = (id: LanguageId) => {
    onChange(id);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const options = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const last = options.length - 1;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? last
          : e.key === "ArrowDown"
            ? (current + 1) % options.length
            : (current - 1 + options.length) % options.length;
    options[next]?.focus();
  };

  return (
    <dialog
      ref={ref}
      className="dialog dialog-compact"
      aria-labelledby="language-title"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className="dialog-body">
        <h2 id="language-title" className="dialog-title">
          Language
        </h2>
        <div className="choice-list" role="radiogroup" aria-labelledby="language-title" onKeyDown={onKeyDown}>
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={l.id === value}
              tabIndex={l.id === value ? 0 : -1}
              className="choice"
              onClick={() => choose(l.id)}
            >
              {l.label}
              {l.id === value && <CheckIcon />}
            </button>
          ))}
        </div>

        <DialogCloseButton onClick={close} />
      </div>
    </dialog>
  );
}
