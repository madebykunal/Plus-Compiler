# Plus Compiler

A minimal, dark code playground for **HTML/CSS/JS**, **C** and **Rust**. It's just an editor, a terminal and a slim icon bar, with no sign-up needed.

- **HTML, CSS and JavaScript** open in a new browser tab as a real page, so you can see and interact with your work right away.
- **C and Rust** run through an AI model that acts as the compiler and runtime. You get compiler errors, panics and program output the way `gcc` or `rustc` would show them. You bring your own API key.

> C and Rust results are *simulated* by AI. They're usually right, but not always. Don't rely on them for anything critical.

## Features

- A VS Code style editor (Monaco) with syntax highlighting for all three languages
- Each language keeps its own code, undo history and scroll position when you switch
- A terminal with optional **stdin** input for C and Rust programs
- A resizable terminal and adjustable font size, both remembered in your browser
- Keyboard shortcuts for everything you do often
- Works with API keys from **OpenAI**, **Anthropic**, **Gemini** and **OpenRouter**

## Getting started

1. Open the app. A short welcome guide appears on your first visit.
2. Pick a language with the **code** icon on the right.
3. Write your code and press **Run** (the play icon) or `Cmd/Ctrl + Enter`.
4. To run C or Rust, click the **key** icon and paste an API key first.

Hover over any icon on the right to see what it does. The **?** icon opens the welcome guide again at any time.

## Keyboard shortcuts

Use `Cmd` on macOS and `Ctrl` everywhere else.

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + Enter` | Run the code |
| `Cmd/Ctrl + E` | Show or hide the icon bar |
| `Cmd/Ctrl + J` | Show or hide the terminal (C and Rust) |

To resize the terminal, drag its top edge, or focus it and use the arrow keys.

## Using your API key

C and Rust need a key from one of these providers. The app recognizes which one from the key itself.

| Provider | Key starts with | Get a key |
| --- | --- | --- |
| Anthropic | `sk-ant-` | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI | `sk-` | [platform.openai.com](https://platform.openai.com/api-keys) |
| Gemini | `AQ.` or `AIza` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| OpenRouter | `sk-or-` | [openrouter.ai](https://openrouter.ai/keys) |

Each run uses your provider account, so normal API charges apply.

### How your key is kept safe

- **Encrypted in your browser.** The key is saved in your browser only, encrypted with a key that can't be read or exported. Anyone looking at the site's storage sees only scrambled data.
- **Never shown again.** After you save it, the app only displays a masked version like `sk-ant-••••1234`.
- **Sent only when you run code.** The key goes to this app's server over HTTPS, which passes it straight to your provider. It is never logged or stored on the server.
- **Isolated previews.** Your HTML/CSS/JS previews run in a sandbox, so code you paste in can't read your key.
- **No third-party scripts.** Everything the page loads comes from this site. A strict security policy stops the page from sending data anywhere else.

You can remove your key at any time from the key dialog.

## Privacy

- HTML/CSS/JS previews run entirely in your browser. That code is never sent to a server.
- C and Rust code is sent to the server and on to your chosen AI provider only when you press Run. It isn't stored.
- Settings like font size are kept in your browser's local storage.

## Limits

- One file per program, up to 20,000 characters
- stdin up to 10,000 characters
- Up to 10 runs per minute per browser session
- The program runs without command-line arguments

## Run it yourself

You'll need [Rust](https://rustup.rs) and [Node.js](https://nodejs.org) 20.9 or newer.

Start the backend on port 8080:

```sh
cd backend
cp .env.example .env
cargo run
```

Start the frontend on port 3000 in a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. If the backend runs somewhere other than `http://127.0.0.1:8080`, set `BACKEND_URL` for the frontend.

### Configuration

The backend is configured through environment variables. See `backend/.env.example` for the full list.

| Variable | Default | Description |
| --- | --- | --- |
| `FALLBACK_API_KEY` | none | Optional server-side key for requests without a key. Leave it empty on public servers. |
| `ANTHROPIC_MODEL` | `claude-opus-5` | Model used for Anthropic keys |
| `OPENAI_MODEL` | `gpt-6-sol` | Model used for OpenAI keys |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Model used for Gemini keys |
| `OPENROUTER_MODEL` | `anthropic/claude-opus-5` | Any OpenRouter model that supports structured outputs |
| `MAX_CODE_CHARS` | `20000` | Maximum program length |
| `RATE_LIMIT_PER_MINUTE` | `10` | Runs per browser session per minute |
| `RATE_LIMIT_GLOBAL_PER_MINUTE` | `60` | Runs across all users per minute |

### API

`POST /api/execute` with a JSON body:

```json
{ "language": "rust", "code": "fn main() { println!(\"hi\"); }", "stdin": "" }
```

Send your provider key in the `X-Api-Key` header. Every response, including errors, has the same shape:

```json
{ "status": "ok" | "compile_error" | "runtime_error", "output": "..." }
```

### Tests

```sh
cd backend && cargo test
cd frontend && npm run typecheck
```

## Tech stack

- **Frontend:** Next.js, React and the Monaco editor
- **Backend:** Rust with Axum

## Contributing

Issues and pull requests are welcome. Some good places to start:

- **Add a language:** add an entry in `frontend/lib/languages.ts` and a matching case in `backend/src/ai/prompt.rs`.
- **Add an AI provider:** add a module in `backend/src/ai/providers/` and its key prefix in `frontend/lib/providers.ts`.
- **Real compilation:** replace `AiClient::simulate` in `backend/src/ai/client.rs`. Nothing else depends on how a run happens.
