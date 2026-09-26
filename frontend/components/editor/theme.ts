import type { Monaco } from "@monaco-editor/react";

export const THEME_NAME = "plus";

export function definePlusTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "d4d4d4" },
      { token: "comment", foreground: "6a9955", fontStyle: "italic" },
      { token: "keyword", foreground: "569cd6" },
      { token: "keyword.type", foreground: "4ec9b0" },
      { token: "keyword.directive", foreground: "c586c0" },
      { token: "type", foreground: "4ec9b0" },
      { token: "string", foreground: "ce9178" },
      { token: "string.escape", foreground: "d7ba7d" },
      { token: "number", foreground: "b5cea8" },
      { token: "annotation", foreground: "dcdcaa" },
      { token: "tag", foreground: "569cd6" },
      { token: "metatag", foreground: "569cd6" },
      { token: "attribute.name", foreground: "9cdcfe" },
      { token: "attribute.value", foreground: "ce9178" },
      { token: "delimiter.html", foreground: "808080" },
    ],
    colors: {
      "editor.background": "#1e1f22",
      "editor.foreground": "#d4d4d4",
      "editorCursor.foreground": "#dfe1e5",
      "editor.lineHighlightBackground": "#26282c",
      "editor.lineHighlightBorder": "#26282c",
      "editor.selectionBackground": "#264f78",
      "editor.inactiveSelectionBackground": "#3a3d41",
      "editorLineNumber.foreground": "#5c5f66",
      "editorLineNumber.activeForeground": "#cfd1d6",
      "editorIndentGuide.background1": "#2e3035",
      "editorIndentGuide.activeBackground1": "#4a4d54",
      "editorWidget.background": "#2b2d30",
      "editorWidget.border": "#393b40",
      "editorSuggestWidget.background": "#2b2d30",
      "editorSuggestWidget.border": "#393b40",
      "editorSuggestWidget.selectedBackground": "#35373b",
      "scrollbarSlider.background": "#ffffff1a",
      "scrollbarSlider.hoverBackground": "#ffffff2e",
      "scrollbarSlider.activeBackground": "#ffffff40",
      focusBorder: "#00000000",
    },
  });
}
