# Plus Compiler

A minimal dark playground for HTML/CSS/JS, C, and Rust. Editor, terminal, and a VS Code style icon bar on the right, nothing else.

- **HTML/CSS/JS** opens in a real browser tab at `/preview.html`, with the code carried in the URL fragment (it never reaches a server). It's a normal page, so extensions such as Figma's capture tools can read it. There is no output panel for it.
- **C and Rust** are *simulated*: the backend asks an AI model to act as gcc / rustc plus the runtime and returns `{ status, output }`. Each visitor brings their own key from OpenAI, Anthropic, Gemini or OpenRouter (the key icon on the right).

```
frontend/                Next.js + Monaco, deployed on Vercel
  app/                   layout and the page that wires everything together
  components/            activity-bar, dialogs, editor, icons, terminal
  hooks/                 page state: API key, settings, runner, shortcuts, dialogs
  lib/                   API client, key storage, providers, languages, helpers
  styles/                one stylesheet per area
  scripts/               Monaco self-hosting and favicon tools
backend/                 Rust + Axum, POST /api/execute and GET /healthz, deployed on Render
  src/ai/                prompt, provider clients, reply parsing, error messages
  src/routes/            the execute route and request header parsing
render.yaml              Render blueprint for the backend (free plan, Docker)
```

## Run it locally

Backend (port 8080):

```sh
cd backend
cp .env.example .env        # optional: a fallback ANTHROPIC_API_KEY
cargo run
```

Frontend (port 3000), in a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend proxies `/api/execute` to the backend (set `BACKEND_URL` if it isn't on `http://127.0.0.1:8080`), so the browser never talks to the AI provider directly.

Shortcuts (Cmd on macOS, Ctrl elsewhere; they take priority over the browser's own):

| keys | action |
| --- | --- |
| `Cmd/Ctrl + Enter` | run |
| `Cmd/Ctrl + E` | show / hide the icon bar |
| `Cmd/Ctrl + J` | show / hide the terminal (C and Rust) |

The icon bar has Run, Language, bigger / smaller text, API key, and the terminal toggle at the bottom; hover an icon for its name. Drag the terminal's top edge (or focus it and use the arrow keys) to resize it between 40% and 70% of the height. Font size and terminal height are remembered per browser. Hiding the icon bar leaves nothing on screen; `Cmd/Ctrl + E` or a reload brings it back.

On a first visit, a short welcome dialog explains the app, that C and Rust results come from AI, and the shortcuts. Dismissing it sets `plus-compiler-welcome-seen` in localStorage. The **?** icon above the terminal icon reopens it any time.

## API keys

Click the key icon on the right and paste a key from any supported provider. The provider is detected from the key's prefix:

| provider | key starts with | API used | default model |
| --- | --- | --- | --- |
| Anthropic | `sk-ant-` | Messages | `claude-opus-5` |
| OpenRouter | `sk-or-` | Chat Completions | `anthropic/claude-opus-5` |
| OpenAI | `sk-` | Responses | `gpt-6-sol` |
| Gemini | `AQ.` (or older `AIza`) | `generateContent` | `gemini-3.8-flash` |

Every provider is asked for the same `{ status, output }` JSON through its structured output feature, and the reply is validated before it's shown. Models are set on the backend (see below).

How the key is protected:

- **In the browser:** stored in IndexedDB, AES-GCM encrypted with a non-extractable key generated in the browser. Storage viewers only see ciphertext, and the dialog only ever shows a mask (`sk-ant-••••1234`).
- **HTML previews** are served with `Content-Security-Policy: sandbox` (no `allow-same-origin`), so pasted-in HTML/JS runs in an opaque origin and can't read the key or navigate the app's tab.
- **In transit:** sent only to this app's own `/api/execute` as an `X-Api-Key` header, which the backend forwards to that key's provider. It is never logged, stored, or echoed back.
- **Framing** is blocked (`X-Frame-Options: DENY`), so another site can't embed the app to phish the key.

- **No third-party scripts:** Monaco is served from the app's own origin (copied from `node_modules` into `public/monaco` at build time), and a Content-Security-Policy with `connect-src 'self'` stops page scripts from sending anything to other origins.
- **Logs:** if a provider ever echoes the key back in an error, it's masked before logging or display.

Any script running on this page can still use the key, so only load code you trust.

## Deploy (free)

The backend goes to Render's free plan and the frontend to Vercel's Hobby plan. Deploy the backend first, because the frontend needs its URL at build time.

### 1. Backend on Render

1. Sign in at [render.com](https://render.com) with GitHub, then choose **New → Blueprint** and pick this repo. Render reads `render.yaml` and builds `backend/Dockerfile` on the free plan.
2. Wait for the first deploy and copy the service URL, e.g. `https://plus-compiler-backend.onrender.com`. Opening `/healthz` should return `ok`.
3. Leave `FALLBACK_API_KEY` unset on a public deployment. Visitors then pay for their own runs with their own keys, and nobody can spend yours.

Free Render services sleep after about 15 minutes idle; the first C/Rust run after that can take up to a minute while the service wakes.

### 2. Frontend on Vercel

1. At [vercel.com/new](https://vercel.com/new), import this repo.
2. Set **Root Directory** to `frontend`. The framework is detected as Next.js.
3. Add the environment variable `BACKEND_URL` = the Render URL from step 1 (https, no trailing slash).
4. Deploy. Redeploy after changing `BACKEND_URL`, since rewrites are resolved at build time.

The browser only ever calls the Vercel app's own `/api/execute`; Vercel proxies it to Render over HTTPS.

## Try the route directly

```sh
curl -s localhost:8080/api/execute -H 'content-type: application/json' \
  -d '{"language":"rust","code":"fn main() { let s = String::from(\"hi\"); let t = s; println!(\"{s}\"); }"}'
```

## API

`POST /api/execute`

| request field | type | notes |
| --- | --- | --- |
| `language` | string | `"c"` or `"rust"` |
| `code` | string | full source, one file, max 20,000 chars |
| `stdin` | string, optional | pre-filled input |

| request header | notes |
| --- | --- |
| `X-Api-Key` | the visitor's OpenAI, Anthropic, Gemini or OpenRouter key; falls back to the server's `FALLBACK_API_KEY` when absent |

Every response, including errors (400 bad input, 429 rate limited), is `{ "status": "ok" | "compile_error" | "runtime_error", "output": string }`.

## Backend config

All via environment (see `backend/.env.example`):

| var | default | |
| --- | --- | --- |
| `FALLBACK_API_KEY` | none | any provider's key, for requests without their own (`ANTHROPIC_API_KEY` also works) |
| `ANTHROPIC_MODEL` | `claude-opus-5` | |
| `ANTHROPIC_EFFORT` | `high` | how hard the model thinks before answering |
| `ANTHROPIC_FALLBACKS` | `default` | server-side refusal fallback; set empty to disable |
| `OPENAI_MODEL` | `gpt-6-sol` | |
| `OPENAI_EFFORT` | `high` | `reasoning.effort`; set empty for models without reasoning |
| `GEMINI_MODEL` | `gemini-3.8-flash` | |
| `OPENROUTER_MODEL` | `anthropic/claude-opus-5` | any OpenRouter model that supports structured outputs |
| `*_BASE_URL` | each provider's API | `ANTHROPIC_`, `OPENAI_`, `GEMINI_`, `OPENROUTER_`; for proxies |
| `HOST` / `PORT` | `127.0.0.1` / `8080` | the Docker image sets `HOST=0.0.0.0`; Render sets `PORT` |
| `MAX_CODE_CHARS` | `20000` | |
| `RATE_LIMIT_PER_MINUTE` | `10` | per browser session |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | `60` | across everyone, caps spend |

## Tests

```sh
cd backend && cargo test
cd frontend && npm run typecheck
```

## Growing it

- **New language:** add an entry to `frontend/lib/languages.ts` and a case in `backend/src/ai/prompt.rs` (plus the `Language` enum).
- **Real execution instead of AI:** replace `AiClient::simulate` in `backend/src/ai/client.rs`; the route and frontend only see `RunResult`.
- **New AI provider:** add a module in `backend/src/ai/providers/` (build the request, read the reply), a `Provider` variant with its key prefix, and the same prefix in `frontend/lib/providers.ts`.
- **Logo:** `public/favicon.svg` and `components/Logo.tsx` hold the mark; `npm run favicon:png` regenerates the 32×32 png fallback.
- **Monaco version:** bump `monaco-editor` in `frontend/package.json`; `npm run dev` / `npm run build` recopy it into `public/monaco`.
