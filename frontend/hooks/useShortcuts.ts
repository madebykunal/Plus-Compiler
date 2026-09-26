import { useEffect, useRef } from "react";
import { isApplePlatform } from "@/lib/platform";

type Handlers = {
  run: () => void;
  toggleBar: () => void;
  toggleTerminal: () => void;
};

export function useShortcuts(handlers: Handlers) {
  const latest = useRef(handlers);

  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.altKey || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest("dialog")) return;
      const modPressed = isApplePlatform() ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (!modPressed) return;

      const { run, toggleBar, toggleTerminal } = latest.current;
      const key = e.key.toLowerCase();
      const action = key === "enter" ? run : key === "e" ? toggleBar : key === "j" ? toggleTerminal : null;
      if (!action) return;
      e.preventDefault();
      e.stopPropagation();
      action();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);
}
