import { useCallback, useRef, useState } from "react";
import type { RunState } from "@/components/terminal/types";
import { execute } from "@/lib/api";
import { getLanguage, type LanguageId } from "@/lib/languages";
import { perLanguage, type PerLanguage } from "@/lib/perLanguage";
import { openPreviewTab, previewUrl } from "@/lib/runHtmlPreview";

export function useRunner(languageId: LanguageId, apiKey: string | null, onBackendRun: () => void) {
  const [runs, setRuns] = useState<PerLanguage<RunState>>(() => perLanguage(() => ({ kind: "idle" })));
  const [stdins, setStdins] = useState<PerLanguage<string>>(() => perLanguage(() => ""));
  const [inlinePreview, setInlinePreview] = useState<string | null>(null);
  const codes = useRef<PerLanguage<string> | null>(null);
  codes.current ??= perLanguage((id) => getLanguage(id).starter);

  const setCode = useCallback((id: LanguageId, value: string) => {
    codes.current![id] = value;
  }, []);

  const setStdin = useCallback((id: LanguageId, value: string) => {
    setStdins((prev) => ({ ...prev, [id]: value }));
  }, []);

  const run = useCallback(() => {
    const lang = getLanguage(languageId);
    const code = codes.current![lang.id];

    if (lang.runner === "browser") {
      const url = previewUrl(code);
      setInlinePreview(openPreviewTab(url) ? null : url);
      return;
    }

    if (runs[lang.id].kind === "running") return;
    const setRun = (state: RunState) => setRuns((prev) => ({ ...prev, [lang.id]: state }));
    onBackendRun();
    setRun({ kind: "running", startedAt: Date.now() });
    execute(lang.id as "c" | "rust", code, stdins[lang.id], apiKey).then((result) =>
      setRun({ kind: "result", ...result }),
    );
  }, [languageId, runs, stdins, apiKey, onBackendRun]);

  const closeInlinePreview = useCallback(() => setInlinePreview(null), []);

  return { runs, stdins, setStdin, setCode, inlinePreview, closeInlinePreview, run };
}
