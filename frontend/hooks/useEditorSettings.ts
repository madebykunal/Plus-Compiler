import { useCallback, useEffect, useRef, useState } from "react";
import {
  clamp,
  DEFAULT_FONT_SIZE,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  STORAGE_KEYS,
  TERMINAL_MAX,
  TERMINAL_MIN,
} from "@/lib/constants";
import { readSetting, writeSetting } from "@/lib/storage";

const clampFontSize = (size: number) => clamp(Math.round(size), FONT_SIZE_MIN, FONT_SIZE_MAX);
const clampTerminalHeight = (height: number) => clamp(height, TERMINAL_MIN, TERMINAL_MAX);

export function useEditorSettings() {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [terminalHeight, setTerminalHeight] = useState(TERMINAL_MIN);
  const heightRef = useRef(TERMINAL_MIN);

  useEffect(() => {
    const storedSize = Number(readSetting(STORAGE_KEYS.fontSize));
    if (storedSize) setFontSize(clampFontSize(storedSize));
    const storedHeight = Number(readSetting(STORAGE_KEYS.terminalHeight));
    if (storedHeight) {
      heightRef.current = clampTerminalHeight(storedHeight);
      setTerminalHeight(heightRef.current);
    }
  }, []);

  const changeFontSize = useCallback((size: number) => {
    const next = clampFontSize(size);
    setFontSize(next);
    writeSetting(STORAGE_KEYS.fontSize, String(next));
  }, []);

  const resizeTerminal = useCallback((height: number) => {
    heightRef.current = clampTerminalHeight(height);
    setTerminalHeight(heightRef.current);
  }, []);

  const saveTerminalHeight = useCallback(() => {
    writeSetting(STORAGE_KEYS.terminalHeight, heightRef.current.toFixed(1));
  }, []);

  return { fontSize, changeFontSize, terminalHeight, resizeTerminal, saveTerminalHeight };
}
