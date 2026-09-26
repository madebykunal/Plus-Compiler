export type LanguageId = "html" | "c" | "rust";

export type Language = {
  id: LanguageId;
  label: string;
  monacoLanguage: string;
  runner: "browser" | "backend";
  starter: string;
};

export const LANGUAGES: Language[] = [
  {
    id: "html",
    label: "HTML/CSS/JS",
    monacoLanguage: "html",
    runner: "browser",
    starter: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Preview</title>
    <style>
      body { font-family: ui-monospace, monospace; padding: 2rem; }
      button { font: inherit; padding: 0.5rem 1rem; border: 1px solid #000; background: #fff; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Hello from Plus Compiler</h1>
    <button id="btn">Clicked 0 times</button>
    <script>
      let count = 0;
      const btn = document.getElementById("btn");
      btn.addEventListener("click", () => {
        count += 1;
        btn.textContent = "Clicked " + count + " times";
      });
    </script>
  </body>
</html>
`,
  },
  {
    id: "c",
    label: "C",
    monacoLanguage: "c",
    runner: "backend",
    starter: `#include <stdio.h>

int main(void) {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
        total += i;
        printf("i = %d, total = %d\\n", i, total);
    }
    return 0;
}
`,
  },
  {
    id: "rust",
    label: "Rust",
    monacoLanguage: "rust",
    runner: "backend",
    starter: `fn main() {
    let words = vec!["plus", "compiler"];
    let joined = words.join(" ");
    println!("{joined}");

    let s = String::from("hello");
    let t = s;
    println!("{s}, {t}");
}
`,
  },
];

export function getLanguage(id: LanguageId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
