"use client";

import { memo } from "react";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "@/lib/constants";
import { getLanguage, type LanguageId } from "@/lib/languages";
import { useModKeyLabel } from "@/lib/platform";
import { detectProvider } from "@/lib/providers";
import { PREVIEW_PATH, PREVIEW_TARGET } from "@/lib/runHtmlPreview";
import {
  CodeIcon,
  FontLargerIcon,
  FontSmallerIcon,
  HelpIcon,
  KeyIcon,
  PlayIcon,
  TerminalIcon,
} from "../icons/BarIcons";
import { ActivityButton } from "./ActivityButton";

type Props = {
  open: boolean;
  onRun: () => void;
  previewHref: () => string;
  running: boolean;
  language: LanguageId;
  languageDialogOpen: boolean;
  onOpenLanguage: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  apiKey: string | null;
  apiKeyDialogOpen: boolean;
  onOpenApiKey: () => void;
  helpOpen: boolean;
  onOpenHelp: () => void;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
};

function ActivityBarView({
  open,
  onRun,
  previewHref,
  running,
  language,
  languageDialogOpen,
  onOpenLanguage,
  fontSize,
  onFontSizeChange,
  apiKey,
  apiKeyDialogOpen,
  onOpenApiKey,
  helpOpen,
  onOpenHelp,
  terminalOpen,
  onToggleTerminal,
}: Props) {
  const mod = useModKeyLabel();
  const lang = getLanguage(language);
  const provider = apiKey ? detectProvider(apiKey) : null;
  const hasTerminal = lang.runner === "backend";

  return (
    <nav className="activity-bar" data-open={open} inert={!open} aria-label="Tools">
      <div className="activity-bar-inner">
        <ActivityButton
          label={running ? "Running…" : "Run"}
          shortcut={`${mod} Enter`}
          className="activity-run"
          link={hasTerminal ? undefined : { href: PREVIEW_PATH, target: PREVIEW_TARGET, resolve: previewHref }}
          onClick={onRun}
          disabled={running}
        >
          <PlayIcon />
        </ActivityButton>

        <ActivityButton label={`Language: ${lang.label}`} active={languageDialogOpen} onClick={onOpenLanguage} haspopup>
          <CodeIcon />
        </ActivityButton>

        <ActivityButton
          label={`Bigger text (${fontSize}px)`}
          onClick={() => onFontSizeChange(fontSize + 1)}
          disabled={fontSize >= FONT_SIZE_MAX}
        >
          <FontLargerIcon />
        </ActivityButton>

        <ActivityButton
          label={`Smaller text (${fontSize}px)`}
          onClick={() => onFontSizeChange(fontSize - 1)}
          disabled={fontSize <= FONT_SIZE_MIN}
        >
          <FontSmallerIcon />
        </ActivityButton>

        <ActivityButton
          label={provider ? `API key: ${provider.name}` : "Add API key"}
          active={apiKeyDialogOpen}
          onClick={onOpenApiKey}
          haspopup
        >
          <KeyIcon />
          {apiKey && <span className="activity-dot" aria-hidden="true" />}
        </ActivityButton>

        <div className="activity-spacer" />

        <ActivityButton label="Help & shortcuts" active={helpOpen} onClick={onOpenHelp} haspopup>
          <HelpIcon />
        </ActivityButton>

        <ActivityButton
          label={hasTerminal ? (terminalOpen ? "Hide terminal" : "Show terminal") : "No terminal for HTML/CSS/JS"}
          shortcut={hasTerminal ? `${mod} J` : undefined}
          active={hasTerminal && terminalOpen}
          pressed={hasTerminal ? terminalOpen : undefined}
          onClick={onToggleTerminal}
          disabled={!hasTerminal}
        >
          <TerminalIcon />
        </ActivityButton>
      </div>
    </nav>
  );
}

export const ActivityBar = memo(ActivityBarView);
