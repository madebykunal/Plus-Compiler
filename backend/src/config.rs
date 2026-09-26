use std::env;

use crate::ai::Provider;

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub fallback_api_key: Option<String>,

    pub anthropic_base_url: String,
    pub anthropic_model: String,
    pub anthropic_effort: String,
    pub anthropic_fallbacks: Option<String>,

    pub openai_base_url: String,
    pub openai_model: String,
    pub openai_effort: Option<String>,

    pub gemini_base_url: String,
    pub gemini_model: String,

    pub openrouter_base_url: String,
    pub openrouter_model: String,

    pub max_code_chars: usize,
    pub rate_limit_per_minute: u32,
    pub rate_limit_global_per_minute: u32,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            host: var_or("HOST", "127.0.0.1"),
            port: parse_or("PORT", 8080),
            fallback_api_key: non_empty("FALLBACK_API_KEY").or_else(|| non_empty("ANTHROPIC_API_KEY")),

            anthropic_base_url: base_url("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
            anthropic_model: var_or("ANTHROPIC_MODEL", "claude-opus-5"),
            anthropic_effort: var_or("ANTHROPIC_EFFORT", "high"),
            anthropic_fallbacks: optional_or("ANTHROPIC_FALLBACKS", "default"),

            openai_base_url: base_url("OPENAI_BASE_URL", "https://api.openai.com"),
            openai_model: var_or("OPENAI_MODEL", "gpt-6-sol"),
            openai_effort: optional_or("OPENAI_EFFORT", "high"),

            gemini_base_url: base_url("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com"),
            gemini_model: var_or("GEMINI_MODEL", "gemini-3.8-flash"),

            openrouter_base_url: base_url("OPENROUTER_BASE_URL", "https://openrouter.ai/api"),
            openrouter_model: var_or("OPENROUTER_MODEL", "anthropic/claude-opus-5"),

            max_code_chars: parse_or("MAX_CODE_CHARS", 20_000),
            rate_limit_per_minute: parse_or("RATE_LIMIT_PER_MINUTE", 10),
            rate_limit_global_per_minute: parse_or("RATE_LIMIT_GLOBAL_PER_MINUTE", 60),
        }
    }

    pub fn model_for(&self, provider: Provider) -> &str {
        match provider {
            Provider::Anthropic => &self.anthropic_model,
            Provider::OpenAi => &self.openai_model,
            Provider::Gemini => &self.gemini_model,
            Provider::OpenRouter => &self.openrouter_model,
        }
    }
}

fn non_empty(name: &str) -> Option<String> {
    env::var(name).ok().map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn var_or(name: &str, default: &str) -> String {
    non_empty(name).unwrap_or_else(|| default.to_string())
}

fn optional_or(name: &str, default: &str) -> Option<String> {
    match env::var(name) {
        Ok(v) if v.trim().is_empty() => None,
        Ok(v) => Some(v.trim().to_string()),
        Err(_) => Some(default.to_string()),
    }
}

fn base_url(name: &str, default: &str) -> String {
    var_or(name, default).trim_end_matches('/').to_string()
}

fn parse_or<T: std::str::FromStr>(name: &str, default: T) -> T {
    env::var(name).ok().and_then(|v| v.trim().parse().ok()).unwrap_or(default)
}
