import type { ExecuteStatus } from "./api";
import {
  SANDBOX_MAX_CHARS,
  SANDBOX_MAX_LINES,
  SANDBOX_RUN_TIMEOUT_MS,
  SANDBOX_START_TIMEOUT_MS,
} from "./constants";
import type { LineMap } from "./sourceMap";

export const SANDBOX_PATH = "/sandbox.html";

export type ConsoleLevel = "log" | "info" | "debug" | "warn" | "error";
export type ConsoleLine = { level: ConsoleLevel; text: string };
export type RunStatus = ExecuteStatus | "timed_out" | "output_limit" | "stopped";
export type SandboxResult = { status: RunStatus; output: string; lines: ConsoleLine[] };

type Options = {
  code: string;
  fileName: string;
  module: boolean;
  lineMap?: LineMap;
  stdin: string;
  onOutput: (lines: ConsoleLine[]) => void;
};

const LEVELS: ReadonlySet<string> = new Set<ConsoleLevel>(["log", "info", "debug", "warn", "error"]);
const FLUSH_MS = 50;

export function runInSandbox({ code, fileName, module, lineMap, stdin, onOutput }: Options) {
  let lines: ConsoleLine[] = [];
  let lineCount = 0;
  let charCount = 0;
  let started = false;
  let ended = false;
  let flushTimer: number | undefined;
  let resolve!: (result: SandboxResult) => void;
  const done = new Promise<SandboxResult>((r) => (resolve = r));

  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.src = SANDBOX_PATH;
  frame.hidden = true;
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  frame.referrerPolicy = "no-referrer";

  const channel = new MessageChannel();
  let deadline = window.setTimeout(
    () => end("runtime_error", "The JavaScript sandbox did not start. Reload the page and try again."),
    SANDBOX_START_TIMEOUT_MS,
  );

  function end(status: RunStatus, output = "") {
    if (ended) return;
    ended = true;
    window.clearTimeout(deadline);
    window.clearTimeout(flushTimer);
    channel.port1.close();
    frame.remove();
    resolve({ status, output, lines });
  }

  function flush() {
    flushTimer = undefined;
    if (!ended) onOutput(lines.slice());
  }

  function append(line: ConsoleLine) {
    lineCount += 1;
    charCount += line.text.length;
    if (lineCount > SANDBOX_MAX_LINES || charCount > SANDBOX_MAX_CHARS) return endForOutputLimit();
    lines.push(line);
    flushTimer ??= window.setTimeout(flush, FLUSH_MS);
  }

  function endForOutputLimit() {
    end(
      "output_limit",
      `Stopped after ${SANDBOX_MAX_LINES.toLocaleString()} lines or ${SANDBOX_MAX_CHARS.toLocaleString()} characters of output.`,
    );
  }

  channel.port1.onmessage = ({ data }: MessageEvent) => {
    if (ended || typeof data !== "object" || data === null) return;
    switch (data.type) {
      case "ready":
        if (started) return;
        started = true;
        window.clearTimeout(deadline);
        deadline = window.setTimeout(
          () => end("timed_out", `Stopped after ${SANDBOX_RUN_TIMEOUT_MS / 1000} seconds. Check for an endless loop.`),
          SANDBOX_RUN_TIMEOUT_MS,
        );
        return;
      case "line":
        if (LEVELS.has(data.level) && typeof data.text === "string") append({ level: data.level, text: data.text });
        return;
      case "clear":
        lines = [];
        flushTimer ??= window.setTimeout(flush, FLUSH_MS);
        return;
      case "done":
        return end("ok");
      case "limit":
        return endForOutputLimit();
      case "error":
      case "fatal":
        return end("runtime_error", typeof data.message === "string" ? data.message : "Unknown error");
    }
  };

  frame.addEventListener(
    "load",
    () => {
      const limits = { lines: SANDBOX_MAX_LINES, chars: SANDBOX_MAX_CHARS };
      const message = { code, fileName, module, lineMap, stdin, limits };
      frame.contentWindow?.postMessage(message, "*", [channel.port2]);
    },
    { once: true },
  );
  document.body.append(frame);

  return { done, stop: () => end("stopped") };
}
