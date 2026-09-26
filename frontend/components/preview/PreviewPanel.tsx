"use client";

import { PREVIEW_TARGET } from "@/lib/runHtmlPreview";
import { CloseIcon } from "../icons/UiIcons";

type Props = {
  url: string;
  onClose: () => void;
};

// Shown when the browser blocks the preview tab. The frame has no
// allow-same-origin, so user code can't reach the app's storage.
export function PreviewPanel({ url, onClose }: Props) {
  return (
    <section className="output preview" aria-label="Preview">
      <div className="output-header">
        <span className="output-title">Preview</span>
        <span className="badge">pop-up blocked</span>
        <a className="link-btn" href={url} target={PREVIEW_TARGET} rel="noopener">
          Open in new tab ↗
        </a>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onClose}
          aria-label="Close preview"
          title="Close preview"
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <iframe
        className="preview-frame"
        src={url}
        title="Preview"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"
      />
    </section>
  );
}
