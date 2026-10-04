import type { ConsoleLine } from "@/lib/runInSandbox";
import { Elapsed } from "./Elapsed";
import { STATUS_LABEL, type RunState } from "./types";

export function OutputBody({ state, idleHint }: { state: RunState; idleHint: string }) {
  switch (state.kind) {
    case "idle":
      return <p className="muted">{idleHint}</p>;

    case "running":
      return (
        <>
          <ConsoleLines lines={state.lines} />
          <p className="muted">
            $ running <Elapsed since={state.startedAt} />
            <span className="cursor" aria-hidden="true" />
          </p>
        </>
      );

    case "result":
      if (state.status === "ok") {
        if (!state.output && state.lines.length === 0) return <p className="muted">(no output)</p>;
        return (
          <>
            <ConsoleLines lines={state.lines} />
            {state.output && <pre>{state.output}</pre>}
          </>
        );
      }
      return (
        <>
          <ConsoleLines lines={state.lines} />
          <div className={state.status === "stopped" ? "run-status muted" : "run-status is-error"}>
            <p className="status-line">✕ {STATUS_LABEL[state.status] ?? state.status}</p>
            {state.output && <pre>{state.output}</pre>}
          </div>
        </>
      );
  }
}

function ConsoleLines({ lines }: { lines: ConsoleLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="console-lines">
      {lines.map((line, i) => (
        <pre key={i} className={`console-line console-${line.level}`}>
          {line.text}
        </pre>
      ))}
    </div>
  );
}
