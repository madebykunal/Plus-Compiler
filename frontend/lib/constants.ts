export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 28;
export const DEFAULT_FONT_SIZE = 18;

export const TERMINAL_MIN = 40;
export const TERMINAL_MAX = 70;
export const TERMINAL_KEYBOARD_STEP = 2;

export const STORAGE_KEYS = {
  fontSize: "plus-compiler-font-size",
  terminalHeight: "plus-compiler-terminal-height",
  welcomeSeen: "plus-compiler-welcome-seen",
  session: "plus-compiler-session",
} as const;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
