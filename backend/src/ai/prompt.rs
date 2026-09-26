use super::Language;

const SPEC_PROMPT: &str = r#"You are simulating a real compiler and runtime for the {language}
programming language, standing in for gcc (for C) or rustc (for
Rust) with default settings.

Given the source code below, work through it in two steps:

1. Decide whether it would actually compile. Check this the way
   the real compiler would, including Rust's borrow checker and
   type rules, or C's type and syntax rules. If it would not
   compile, write the error the way that compiler actually
   formats it, with a line number if you can place one.

2. If it compiles, decide whether it would panic, crash, or hit
   undefined behavior at runtime, and reflect that honestly
   instead of assuming a clean run. If it runs cleanly, give the
   exact text it would print to stdout, nothing more, nothing
   less.

Reply with a single JSON object and nothing else, no commentary
before or after it:

{"status": "ok" | "compile_error" | "runtime_error", "output": "the exact text the terminal would show"}

Be strict. Do not assume code works just because it looks
reasonable."#;

const CONVENTIONS: &str = r#"
Conventions for this environment:
- The program is a single file, {file}, built with `{build}` and run with no command line arguments.
- The source is shown with line numbers ("  12 | ") for reference only. They are not part of the file.
- "compile_error": output is the compiler's diagnostics exactly as the compiler prints them.
- "runtime_error": output is whatever the program printed to stdout before failing, followed by the message the runtime or shell would print, for example a Rust panic message or "Segmentation fault (core dumped)".
- stdin receives exactly the text given under stdin, then end of file."#;

pub fn system_prompt(language: Language) -> String {
    let (name, file, build) = match language {
        Language::C => ("C", "main.c", "gcc main.c -o main && ./main"),
        Language::Rust => ("Rust", "src/main.rs", "cargo run (edition 2024, debug profile)"),
    };
    let mut prompt = SPEC_PROMPT.replace("{language}", name);
    prompt.push('\n');
    prompt.push_str(&CONVENTIONS.replace("{file}", file).replace("{build}", build));
    prompt
}

pub fn user_message(code: &str, stdin: &str) -> String {
    let width = code.lines().count().max(1).to_string().len();
    let numbered: Vec<String> = code
        .lines()
        .enumerate()
        .map(|(i, line)| format!("{:>width$} | {line}", i + 1))
        .collect();

    let stdin_section = if stdin.is_empty() {
        "stdin is empty (the program sees end of file immediately).".to_string()
    } else {
        format!("<stdin>\n{stdin}\n</stdin>")
    };

    format!("<source>\n{}\n</source>\n\n{stdin_section}", numbered.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_prompt_fills_language() {
        let p = system_prompt(Language::Rust);
        assert!(p.starts_with("You are simulating a real compiler and runtime for the Rust\n"));
        assert!(p.contains("src/main.rs"));
        assert!(!p.contains("{language}") && !p.contains("{file}"));
        assert!(system_prompt(Language::C).contains("gcc main.c"));
    }

    #[test]
    fn user_message_numbers_lines() {
        let code = (1..=10).map(|i| format!("l{i}")).collect::<Vec<_>>().join("\n");
        let msg = user_message(&code, "");
        assert!(msg.contains(" 1 | l1\n"));
        assert!(msg.contains("10 | l10\n</source>"));
        assert!(msg.contains("stdin is empty"));
        assert!(user_message("x", "42").contains("<stdin>\n42\n</stdin>"));
    }
}
