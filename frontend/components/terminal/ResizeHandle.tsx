"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { TERMINAL_KEYBOARD_STEP, TERMINAL_MAX, TERMINAL_MIN } from "@/lib/constants";

type Props = {
  height: number;
  onResize: (height: number) => void;
  onResizeEnd: () => void;
};

export function ResizeHandle({ height, onResize, onResizeEnd }: Props) {
  const dragging = useRef(false);

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    document.body.classList.add("is-resizing");
  };

  const drag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const area = e.currentTarget.closest(".workspace")?.getBoundingClientRect();
    if (area) onResize(((area.bottom - e.clientY) / area.height) * 100);
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.classList.remove("is-resizing");
    onResizeEnd();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next =
      e.key === "ArrowUp"
        ? height + TERMINAL_KEYBOARD_STEP
        : e.key === "ArrowDown"
          ? height - TERMINAL_KEYBOARD_STEP
          : e.key === "Home"
            ? TERMINAL_MIN
            : e.key === "End"
              ? TERMINAL_MAX
              : null;
    if (next === null) return;
    e.preventDefault();
    onResize(next);
    onResizeEnd();
  };

  return (
    <div
      className="terminal-resizer"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize terminal"
      aria-valuemin={TERMINAL_MIN}
      aria-valuemax={TERMINAL_MAX}
      aria-valuenow={Math.round(height)}
      tabIndex={0}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={onKeyDown}
    />
  );
}
