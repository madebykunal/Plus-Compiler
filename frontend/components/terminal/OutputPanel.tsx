"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useModKeyLabel } from "@/lib/platform";
import { ChevronDownIcon } from "../icons/UiIcons";
import { OutputBody } from "./OutputBody";
import { ResizeHandle } from "./ResizeHandle";
import type { RunState } from "./types";

type Props = {
  runner: "sandbox" | "backend";
  state: RunState;
  stdin: string;
  onStdinChange: (value: string) => void;
  onStop: () => void;
  onClose: () => void;
  height: number;
  onResize: (height: number) => void;
  onResizeEnd: () => void;
};

const TEXT = {
  sandbox: {
    badge: "in browser",
    idle: "Press Run to run your code. Console output appears here.",
    stdin: "Input for prompt(), one line per call",
  },
  backend: {
    badge: "simulated",
    idle: "Press Run to compile and run. Output appears here.",
    stdin: "Input fed to the program on stdin",
  },
};

export function OutputPanel({
  runner,
  state,
  stdin,
  onStdinChange,
  onStop,
  onClose,
  height,
  onResize,
  onResizeEnd,
}: Props) {
  const [stdinOpen, setStdinOpen] = useState(false);
  const mod = useModKeyLabel();
  const text = TEXT[runner];
  const bodyRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body && stickToBottom.current) body.scrollTop = body.scrollHeight;
  }, [state]);

  const onScroll = () => {
    const body = bodyRef.current;
    if (body) stickToBottom.current = body.scrollHeight - body.scrollTop - body.clientHeight < 24;
  };

  return (
    <section className="output" aria-label="Terminal" style={{ flexBasis: `${height}%` }}>
      <ResizeHandle height={height} onResize={onResize} onResizeEnd={onResizeEnd} />
      <div className="output-header">
        <span className="output-title">Terminal</span>
        <span className="badge">{text.badge}</span>
        {runner === "sandbox" && state.kind === "running" && (
          <button type="button" className="link-btn" onClick={onStop}>
            ■ stop
          </button>
        )}
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
          placeholder={text.stdin}
          spellCheck={false}
          rows={4}
        />
      )}

      <div ref={bodyRef} className="output-body" aria-live="polite" onScroll={onScroll}>
        <OutputBody state={state} idleHint={text.idle} />
      </div>
    </section>
  );
}
