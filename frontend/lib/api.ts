import { STORAGE_KEYS } from "./constants";

export type ExecuteStatus = "ok" | "compile_error" | "runtime_error";

export type ExecuteResult = {
  status: ExecuteStatus;
  output: string;
};

export const NO_KEY_MESSAGE =
  "Add an API key from OpenAI, Anthropic, Gemini or OpenRouter with the key icon on the right to run C and Rust.";

function sessionId(): string {
  let id = sessionStorage.getItem(STORAGE_KEYS.session);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEYS.session, id);
  }
  return id;
}

export async function execute(
  language: "c" | "rust",
  code: string,
  stdin: string,
  apiKey: string | null,
  signal?: AbortSignal,
): Promise<ExecuteResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Session-Id": sessionId() };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  let res: Response;
  try {
    res = await fetch("/api/execute", {
      method: "POST",
      headers,
      body: JSON.stringify({ language, code, stdin: stdin || undefined }),
      signal,
      credentials: "same-origin",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { status: "runtime_error", output: "Could not reach the backend. Is it running?" };
  }

  try {
    const data = (await res.json()) as Partial<ExecuteResult>;
    if (typeof data.status === "string" && typeof data.output === "string") {
      return { status: data.status as ExecuteStatus, output: data.output };
    }
  } catch {}
  return { status: "runtime_error", output: `Backend returned an unexpected response (HTTP ${res.status}).` };
}
