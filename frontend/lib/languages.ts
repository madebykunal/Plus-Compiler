export type LanguageId = "html" | "javascript" | "typescript" | "c" | "rust";

export type Language = {
  id: LanguageId;
  label: string;
  fileName: string;
  monacoLanguage: string;
  tabSize: number;
  runner: "preview" | "sandbox" | "backend";
  starter: string;
};

export type SandboxLanguageId = "javascript" | "typescript";

export const LANGUAGES: Language[] = [
  {
    id: "html",
    label: "HTML/CSS/JS",
    fileName: "main.html",
    monacoLanguage: "html",
    tabSize: 2,
    runner: "preview",
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
    id: "javascript",
    label: "JavaScript",
    fileName: "main.js",
    monacoLanguage: "javascript",
    tabSize: 2,
    runner: "sandbox",
    starter: `const name = prompt("What's your name?") ?? "world";
console.log(\`Hello, \${name}!\`);

const scores = [72, 88, 95];
const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
console.log({ scores, average });
`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    fileName: "main.ts",
    monacoLanguage: "typescript",
    tabSize: 2,
    runner: "sandbox",
    starter: `type Student = { name: string; score: number };

const students: Student[] = [
  { name: "Ada", score: 92 },
  { name: "Linus", score: 78 },
];

function grade(score: number): string {
  return score >= 90 ? "A" : score >= 80 ? "B" : "C";
}

for (const student of students) {
  console.log(\`\${student.name}: \${grade(student.score)}\`);
}
`,
  },
  {
    id: "c",
    label: "C",
    fileName: "main.c",
    monacoLanguage: "c",
    tabSize: 4,
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
    fileName: "main.rs",
    monacoLanguage: "rust",
    tabSize: 4,
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
