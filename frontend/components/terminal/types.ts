import type { ConsoleLine, RunStatus } from "@/lib/runInSandbox";

export type RunState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number; lines: ConsoleLine[] }
  | { kind: "result"; status: RunStatus; output: string; lines: ConsoleLine[] };

export const STATUS_LABEL: Record<RunStatus, string> = {
  ok: "ok",
  compile_error: "compile error",
  runtime_error: "runtime error",
  timed_out: "timed out",
  output_limit: "output limit",
  stopped: "stopped",
};
