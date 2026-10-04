import { useCallback, useEffect, useRef, useState } from "react";
import type { RunState } from "@/components/terminal/types";
import { execute } from "@/lib/api";
import { compileScript } from "@/lib/compileScript";
import { getLanguage, type LanguageId, type SandboxLanguageId } from "@/lib/languages";
import { perLanguage, type PerLanguage } from "@/lib/perLanguage";
import { openPreviewTab, previewUrl } from "@/lib/runHtmlPreview";
import { runInSandbox } from "@/lib/runInSandbox";

type SandboxRun = { stop: () => void };

export function useRunner(languageId: LanguageId, apiKey: string | null, onTerminalRun: () => void) {
  const [runs, setRuns] = useState<PerLanguage<RunState>>(() => perLanguage(() => ({ kind: "idle" })));
  const [stdins, setStdins] = useState<PerLanguage<string>>(() => perLanguage(() => ""));
  const codes = useRef<PerLanguage<string> | null>(null);
  codes.current ??= perLanguage((id) => getLanguage(id).starter);
  const sandboxRuns = useRef<Partial<Record<SandboxLanguageId, SandboxRun>>>({});

  useEffect(() => {
    const active = sandboxRuns.current;
    return () => Object.values(active).forEach((run) => run.stop());
  }, []);

  const setCode = useCallback((id: LanguageId, value: string) => {
    codes.current![id] = value;
  }, []);

  const setStdin = useCallback((id: LanguageId, value: string) => {
    setStdins((prev) => ({ ...prev, [id]: value }));
  }, []);

  const previewHref = useCallback(() => previewUrl(codes.current![languageId]), [languageId]);

  const runSandbox = useCallback(
    (id: SandboxLanguageId) => {
      sandboxRuns.current[id]?.stop();
      const startedAt = Date.now();
      let stopped = false;
      let sandbox: SandboxRun | null = null;
      const run: SandboxRun = {
        stop: () => {
          stopped = true;
          sandbox?.stop();
        },
      };
      sandboxRuns.current[id] = run;
      const isCurrent = () => sandboxRuns.current[id] === run;
      const setRun = (state: RunState) => {
        if (isCurrent()) setRuns((prev) => ({ ...prev, [id]: state }));
      };
      const finish = (state: RunState) => {
        setRun(state);
        if (isCurrent()) delete sandboxRuns.current[id];
      };

      onTerminalRun();
      setRun({ kind: "running", startedAt, lines: [] });

      compileScript(id, codes.current![id])
        .then(async (compiled) => {
          if (stopped) return finish({ kind: "result", status: "stopped", output: "", lines: [] });
          if (!compiled.ok) {
            return finish({ kind: "result", status: "compile_error", output: compiled.output, lines: [] });
          }
          const handle = runInSandbox({
            code: compiled.code,
            fileName: getLanguage(id).fileName,
            module: id === "typescript",
            lineMap: compiled.lineMap,
            stdin: stdins[id],
            onOutput: (lines) => setRun({ kind: "running", startedAt, lines }),
          });
          sandbox = handle;
          finish({ kind: "result", ...(await handle.done) });
        })
        .catch((err: unknown) => {
          finish({ kind: "result", status: "runtime_error", output: `Could not run the code: ${err}`, lines: [] });
        });
    },
    [stdins, onTerminalRun],
  );

  const stop = useCallback(() => {
    const lang = getLanguage(languageId);
    if (lang.runner === "sandbox") sandboxRuns.current[lang.id as SandboxLanguageId]?.stop();
  }, [languageId]);

  const run = useCallback(() => {
    const lang = getLanguage(languageId);
    const code = codes.current![lang.id];

    if (lang.runner === "preview") {
      openPreviewTab(previewUrl(code));
      return;
    }

    if (lang.runner === "sandbox") {
      runSandbox(lang.id as SandboxLanguageId);
      return;
    }

    if (runs[lang.id].kind === "running") return;
    const setRun = (state: RunState) => setRuns((prev) => ({ ...prev, [lang.id]: state }));
    onTerminalRun();
    setRun({ kind: "running", startedAt: Date.now(), lines: [] });
    execute(lang.id as "c" | "rust", code, stdins[lang.id], apiKey).then((result) =>
      setRun({ kind: "result", ...result, lines: [] }),
    );
  }, [languageId, runs, stdins, apiKey, onTerminalRun, runSandbox]);

  return { runs, stdins, setStdin, setCode, previewHref, run, stop };
}
