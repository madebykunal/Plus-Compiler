"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { ActivityBar } from "@/components/activity-bar/ActivityBar";
import { ApiKeyDialog } from "@/components/dialogs/ApiKeyDialog";
import { LanguageDialog } from "@/components/dialogs/LanguageDialog";
import { WelcomeDialog } from "@/components/dialogs/WelcomeDialog";
import { Editor } from "@/components/editor/Editor";
import { OutputPanel } from "@/components/terminal/OutputPanel";
import { useApiKey } from "@/hooks/useApiKey";
import { useEditorSettings } from "@/hooks/useEditorSettings";
import { useRunner } from "@/hooks/useRunner";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useWelcome } from "@/hooks/useWelcome";
import { getLanguage, type LanguageId } from "@/lib/languages";

export default function Page() {
  const [languageId, setLanguageId] = useState<LanguageId>("html");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [barOpen, setBarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);

  const { apiKey, saveKey, removeKey } = useApiKey();
  const { fontSize, changeFontSize, terminalHeight, resizeTerminal, saveTerminalHeight } = useEditorSettings();
  const welcome = useWelcome();

  const showTerminal = useCallback(() => setTerminalOpen(true), []);
  const hideTerminal = useCallback(() => setTerminalOpen(false), []);
  const toggleTerminal = useCallback(() => setTerminalOpen((open) => !open), []);
  const openLanguageDialog = useCallback(() => setLanguageDialogOpen(true), []);
  const closeLanguageDialog = useCallback(() => setLanguageDialogOpen(false), []);
  const openKeyDialog = useCallback(() => setKeyDialogOpen(true), []);
  const closeKeyDialog = useCallback(() => setKeyDialogOpen(false), []);

  const toggleBar = useCallback(() => {
    if (document.activeElement?.closest(".activity-bar")) {
      document.querySelector<HTMLElement>(".monaco-editor textarea")?.focus();
    }
    setBarOpen((open) => !open);
  }, []);

  const { runs, stdins, setStdin, setCode, previewBlocked, run } = useRunner(languageId, apiKey, showTerminal);
  useShortcuts({ run, toggleBar, toggleTerminal });

  const language = getLanguage(languageId);
  const running = runs[languageId].kind === "running";

  const onCodeChange = useCallback((value: string) => setCode(languageId, value), [languageId, setCode]);
  const onStdinChange = useCallback((value: string) => setStdin(languageId, value), [languageId, setStdin]);

  return (
    <div className="app" style={{ "--code-size": `${fontSize}px` } as CSSProperties}>
      <main className="workspace">
        {language.runner === "browser" && previewBlocked && (
          <p className="notice" role="alert">
            Your browser blocked the preview tab. Allow pop-ups for this site, then press Run again.
          </p>
        )}

        <div className="editor-pane">
          <Editor language={language} fontSize={fontSize} onChange={onCodeChange} />
        </div>
        {language.runner === "backend" && terminalOpen && (
          <OutputPanel
            state={runs[languageId]}
            stdin={stdins[languageId]}
            onStdinChange={onStdinChange}
            onClose={hideTerminal}
            height={terminalHeight}
            onResize={resizeTerminal}
            onResizeEnd={saveTerminalHeight}
          />
        )}
      </main>

      <ActivityBar
        open={barOpen}
        onRun={run}
        running={running}
        language={languageId}
        languageDialogOpen={languageDialogOpen}
        onOpenLanguage={openLanguageDialog}
        fontSize={fontSize}
        onFontSizeChange={changeFontSize}
        apiKey={apiKey}
        apiKeyDialogOpen={keyDialogOpen}
        onOpenApiKey={openKeyDialog}
        helpOpen={welcome.open}
        onOpenHelp={welcome.show}
        terminalOpen={terminalOpen}
        onToggleTerminal={toggleTerminal}
      />

      <LanguageDialog
        open={languageDialogOpen}
        value={languageId}
        onChange={setLanguageId}
        onClose={closeLanguageDialog}
      />

      <ApiKeyDialog
        open={keyDialogOpen}
        savedKey={apiKey}
        onSave={saveKey}
        onRemove={removeKey}
        onClose={closeKeyDialog}
      />

      <WelcomeDialog open={welcome.open} onClose={welcome.dismiss} onAddKey={openKeyDialog} />
    </div>
  );
}
