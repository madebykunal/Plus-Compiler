import type { Monaco } from "@monaco-editor/react";
import type { Uri, typescript } from "monaco-editor";
import { getLanguage, type SandboxLanguageId } from "./languages";
import { loadMonaco } from "./monaco";
import { decodeMappings, type LineMap } from "./sourceMap";

type Diagnostic = typescript.Diagnostic;
type MessageChain = Diagnostic["messageText"];
type TypeScriptWorker = typescript.TypeScriptWorker;

export type CompileResult = { ok: true; code: string; lineMap?: LineMap } | { ok: false; output: string };

const ERROR = 1;

export async function compileScript(id: SandboxLanguageId, code: string): Promise<CompileResult> {
  const monaco = await loadMonaco();
  const lang = getLanguage(id);
  const uri = monaco.Uri.parse(lang.fileName);
  const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(code, lang.monacoLanguage, uri);
  const worker = await languageWorker(monaco, id, uri);
  const file = uri.toString();

  const diagnostics = [
    ...(await worker.getSyntacticDiagnostics(file)),
    ...(id === "typescript" ? await worker.getSemanticDiagnostics(file) : []),
  ].filter((d) => d.category === ERROR);

  if (diagnostics.length > 0) {
    const describe = (d: Diagnostic) => {
      const { lineNumber, column } = model.getPositionAt(d.start ?? 0);
      const kind = id === "typescript" ? `error TS${d.code}` : "SyntaxError";
      return `${lang.fileName}:${lineNumber}:${column} - ${kind}: ${flatten(d.messageText)}`;
    };
    return { ok: false, output: diagnostics.map(describe).join("\n\n") };
  }

  if (id === "javascript") return { ok: true, code: model.getValue() };

  const emitted = await worker.getEmitOutput(file);
  const js = emitted.outputFiles.find((f) => f.name.endsWith(".js"));
  const map = emitted.outputFiles.find((f) => f.name.endsWith(".js.map"));
  if (emitted.emitSkipped || !js) return { ok: false, output: "TypeScript could not compile this file." };
  return {
    ok: true,
    code: js.text.replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n"),
    lineMap: map ? decodeMappings(JSON.parse(map.text).mappings) : undefined,
  };
}

async function languageWorker(monaco: Monaco, id: SandboxLanguageId, uri: Uri): Promise<TypeScriptWorker> {
  const get = id === "typescript" ? monaco.typescript.getTypeScriptWorker : monaco.typescript.getJavaScriptWorker;
  for (let attempt = 0; ; attempt++) {
    try {
      return await (await get())(uri);
    } catch (err) {
      if (attempt >= 20) throw err;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

function flatten(message: MessageChain, indent = ""): string {
  if (typeof message === "string") return message;
  const next = message.next?.map((m) => `\n${indent}  ${flatten(m, `${indent}  `)}`).join("") ?? "";
  return message.messageText + next;
}
