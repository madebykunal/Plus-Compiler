"use client";

import MonacoEditor, { loader, type BeforeMount, type EditorProps, type OnMount } from "@monaco-editor/react";
import { memo, useCallback, useMemo } from "react";
import type { Language } from "@/lib/languages";
import { quietMonacoClipboard } from "@/lib/quietMonacoClipboard";
import { definePlusTheme, THEME_NAME } from "./theme";

loader.config({ paths: { vs: "/monaco/vs" } });

type Props = {
  language: Language;
  fontSize: number;
  onChange: (value: string) => void;
};

const MONO_FONT = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace';

const beforeMount: BeforeMount = (monaco) => {
  quietMonacoClipboard();
  definePlusTheme(monaco);
};

const handleMount: OnMount = (editor) => editor.focus();

const loading = <div className="editor-loading">Loading editor…</div>;

function EditorView({ language, fontSize, onChange }: Props) {
  const tabSize = language.id === "html" ? 2 : 4;

  const options = useMemo<EditorProps["options"]>(
    () => ({
      fontFamily: MONO_FONT,
      fontSize,
      lineHeight: Math.round(fontSize * 1.6),
      tabSize,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 14, bottom: 14 },
      renderLineHighlight: "line",
      bracketPairColorization: { enabled: true },
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
      fixedOverflowWidgets: true,
    }),
    [fontSize, tabSize],
  );

  const handleChange = useCallback((value: string | undefined) => onChange(value ?? ""), [onChange]);

  return (
    <MonacoEditor
      path={`main.${language.id === "rust" ? "rs" : language.id}`}
      defaultLanguage={language.monacoLanguage}
      defaultValue={language.starter}
      theme={THEME_NAME}
      beforeMount={beforeMount}
      onMount={handleMount}
      onChange={handleChange}
      loading={loading}
      options={options}
    />
  );
}

export const Editor = memo(EditorView);
