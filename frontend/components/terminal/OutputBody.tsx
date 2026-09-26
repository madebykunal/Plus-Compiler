import { Elapsed } from "./Elapsed";
import { STATUS_LABEL, type RunState } from "./types";

export function OutputBody({ state }: { state: RunState }) {
  switch (state.kind) {
    case "idle":
      return <p className="muted">Press Run to compile and run. Output appears here.</p>;

    case "running":
      return (
        <p className="muted">
          $ running <Elapsed since={state.startedAt} />
          <span className="cursor" aria-hidden="true" />
        </p>
      );

    case "result":
      if (state.status === "ok") {
        return state.output ? <pre>{state.output}</pre> : <p className="muted">(no output)</p>;
      }
      return (
        <div className="is-error">
          <p className="status-line">✕ {STATUS_LABEL[state.status] ?? state.status}</p>
          <pre>{state.output}</pre>
        </div>
      );
  }
}
