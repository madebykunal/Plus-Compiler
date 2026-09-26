pub mod client;
pub mod errors;
pub mod prompt;
mod providers;
mod reply;

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Provider {
    Anthropic,
    OpenAi,
    Gemini,
    OpenRouter,
}

impl Provider {
    pub fn detect(key: &str) -> Option<Self> {
        if key.starts_with("sk-ant-") {
            Some(Self::Anthropic)
        } else if key.starts_with("sk-or-") {
            Some(Self::OpenRouter)
        } else if key.starts_with("sk-") {
            Some(Self::OpenAi)
        } else if key.starts_with("AQ.") || key.starts_with("AIza") {
            Some(Self::Gemini)
        } else {
            None
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Self::Anthropic => "Anthropic",
            Self::OpenAi => "OpenAI",
            Self::Gemini => "Gemini",
            Self::OpenRouter => "OpenRouter",
        }
    }

    pub fn model_env(self) -> &'static str {
        match self {
            Self::Anthropic => "ANTHROPIC_MODEL",
            Self::OpenAi => "OPENAI_MODEL",
            Self::Gemini => "GEMINI_MODEL",
            Self::OpenRouter => "OPENROUTER_MODEL",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    C,
    Rust,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Ok,
    CompileError,
    RuntimeError,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct RunResult {
    pub status: Status,
    pub output: String,
}

impl RunResult {
    pub fn runtime_error(output: impl Into<String>) -> Self {
        Self { status: Status::RuntimeError, output: output.into() }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_provider_from_key_prefix() {
        assert_eq!(Provider::detect("sk-ant-api03-abc"), Some(Provider::Anthropic));
        assert_eq!(Provider::detect("sk-or-v1-abc"), Some(Provider::OpenRouter));
        assert_eq!(Provider::detect("sk-proj-abc"), Some(Provider::OpenAi));
        assert_eq!(Provider::detect("sk-abc"), Some(Provider::OpenAi));
        assert_eq!(Provider::detect("AIzaSyAbc"), Some(Provider::Gemini));
        assert_eq!(Provider::detect("AQ.Ab8RN6Abc"), Some(Provider::Gemini));
        assert_eq!(Provider::detect("gsk_abc"), None);
    }
}
