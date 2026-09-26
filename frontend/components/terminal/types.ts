import type { ExecuteStatus } from "@/lib/api";

export type RunState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "result"; status: ExecuteStatus; output: string };

export const STATUS_LABEL: Record<ExecuteStatus, string> = {
  ok: "ok",
  compile_error: "compile error",
  runtime_error: "runtime error",
};
