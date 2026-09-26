"use client";

import { useState } from "react";
import { useModKeyLabel } from "@/lib/platform";
import { ChevronDownIcon } from "../icons/UiIcons";
import { OutputBody } from "./OutputBody";
import { ResizeHandle } from "./ResizeHandle";
import type { RunState } from "./types";

type Props = {
  state: RunState;
  stdin: string;
  onStdinChange: (value: string) => void;
  onClose: () => void;
  height: number;
  onResize: (height: number) => void;
  onResizeEnd: () => void;
};

export function OutputPanel({ state, stdin, onStdinChange, onClose, height, onResize, onResizeEnd }: Props) {
  const [stdinOpen, setStdinOpen] = useState(false);
  const mod = useModKeyLabel();

  return (
    <section className="output" aria-label="Terminal" style={{ flexBasis: `${height}%` }}>
      <ResizeHandle height={height} onResize={onResize} onResizeEnd={onResizeEnd} />
      <div className="output-header">
        <span className="output-title">Terminal</span>
        <span className="badge">simulated</span>
        <button
          type="button"
          className="link-btn"
          onClick={() => setStdinOpen((o) => !o)}
          aria-expanded={stdinOpen}
        >
          {stdinOpen ? "− stdin" : "+ stdin"}
          {!stdinOpen && stdin ? " •" : ""}
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onClose}
          aria-label="Hide terminal"
          title={`Hide terminal (${mod} J)`}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {stdinOpen && (
        <textarea
          className="stdin"
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="Input fed to the program on stdin"
          spellCheck={false}
          rows={4}
        />
      )}

      <div className="output-body" aria-live="polite">
        <OutputBody state={state} />
      </div>
    </section>
  );
}
