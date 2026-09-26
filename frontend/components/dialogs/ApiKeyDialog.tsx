"use client";

import { useState } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";
import { detectProvider, maskApiKey, validateApiKey } from "@/lib/providers";
import { CheckIcon, InfoIcon } from "../icons/UiIcons";
import { DialogCloseButton } from "./DialogCloseButton";

type Props = {
  open: boolean;
  savedKey: string | null;
  onSave: (key: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function ApiKeyDialog({ open, savedKey, onSave, onRemove, onClose }: Props) {
  const { ref, close, onBackdropClick } = useModalDialog(open);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const detected = detectProvider(draft.trim());

  const handleClose = () => {
    setDraft("");
    setError(null);
    onClose();
  };

  const save = () => {
    const value = draft.trim();
    if (!value) return;
    const problem = validateApiKey(value);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(value);
    close();
  };

  const remove = () => {
    onRemove();
    close();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="api-key-title"
      aria-describedby="api-key-description"
      onClose={handleClose}
      onClick={onBackdropClick}
    >
      <div className="dialog-body">
        <h2 id="api-key-title" className="dialog-title">
          API key
        </h2>
        <p id="api-key-description" className="dialog-text">
          Used to run C and Rust. It&apos;s encrypted and stays in this browser.
        </p>

        {savedKey && (
          <div className="field">
            <span className="field-label">Current key</span>
            <div className="saved-key">
              <span className="saved-key-provider">
                <span className="status-dot" aria-hidden="true" />
                {detectProvider(savedKey)?.name}
              </span>
              <code>{maskApiKey(savedKey)}</code>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="api-key-input" className="field-label">
            {savedKey ? "Replace with a new key" : "Your key"}
          </label>
          <input
            id="api-key-input"
            className="field-input"
            type="password"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder="Paste your API key"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "api-key-error" : detected ? "api-key-provider" : "api-key-note"}
          />
          {error ? (
            <p id="api-key-error" className="field-error" role="alert">
              {error}
            </p>
          ) : (
            detected && (
              <p id="api-key-provider" className="field-hint">
                <CheckIcon size={14} />
                {detected.name} key
              </p>
            )
          )}
        </div>

        <p id="api-key-note" className="dialog-note">
          <InfoIcon />
          <span>
            Currently supports keys from <strong>OpenAI</strong>, <strong>Anthropic</strong>, <strong>Gemini</strong>{" "}
            and <strong>OpenRouter</strong>.
          </span>
        </p>

        <div className="dialog-actions">
          {savedKey && (
            <button type="button" className="btn btn-danger" onClick={remove}>
              Remove key
            </button>
          )}
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!draft.trim()}>
            Save
          </button>
        </div>

        <DialogCloseButton onClick={close} />
      </div>
    </dialog>
  );
}
