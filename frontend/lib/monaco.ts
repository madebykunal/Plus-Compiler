import { loader, type Monaco } from "@monaco-editor/react";

loader.config({ paths: { vs: "/monaco/vs" } });

const ES2022 = 9;
const MODULE_DETECTION_FORCE = 3;

let configured = false;

export function configureMonaco(monaco: Monaco) {
  if (configured) return;
  configured = true;
  monaco.typescript.javascriptDefaults.setCompilerOptions({
    ...monaco.typescript.javascriptDefaults.getCompilerOptions(),
    moduleDetection: MODULE_DETECTION_FORCE,
  });
  monaco.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.typescript.typescriptDefaults.getCompilerOptions(),
    target: ES2022,
    module: monaco.typescript.ModuleKind.ESNext,
    moduleDetection: MODULE_DETECTION_FORCE,
    strict: true,
    sourceMap: true,
  });
}

export async function loadMonaco(): Promise<Monaco> {
  const monaco = await loader.init();
  configureMonaco(monaco);
  return monaco;
}
