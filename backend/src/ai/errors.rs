use reqwest::StatusCode;

use super::Provider;

pub const NO_KEY: &str = "Add an API key from OpenAI, Anthropic, Gemini or OpenRouter with the key icon on the right to run C and Rust.";
pub const UNREADABLE: &str = "The compiler simulator returned a reply that could not be read. Try running again.";
pub const UNKNOWN_KEY: &str = "That API key isn't from a supported provider. Use a key from OpenAI (sk-…), Anthropic (sk-ant-…), Gemini (AQ.… or AIza…) or OpenRouter (sk-or-…).";

#[derive(Clone, Copy)]
pub enum KeySource {
    Visitor,
    Server,
}

pub fn unavailable(provider: Provider) -> String {
    format!("{} is unavailable right now. Try again in a moment.", provider.name())
}

pub fn unreachable(provider: Provider, timed_out: bool) -> String {
    let name = provider.name();
    if timed_out {
        format!("{name} took too long to answer. Try again, or try a smaller program.")
    } else {
        format!("Couldn't reach {name}. Check that the backend is online, then try again.")
    }
}

pub fn describe(provider: Provider, source: KeySource, status: StatusCode, detail: &str, key: &str, model: &str) -> String {
    let name = provider.name();
    let bad_key = status == StatusCode::UNAUTHORIZED
        || (status == StatusCode::FORBIDDEN && provider != Provider::OpenRouter)
        || detail.contains("API_KEY_INVALID");
    if bad_key {
        return match source {
            KeySource::Visitor => format!("Your {name} API key was rejected. Check it with the key icon on the right."),
            KeySource::Server => {
                "The backend's FALLBACK_API_KEY was rejected. Check it and restart the backend.".to_string()
            }
        };
    }
    if status == StatusCode::PAYMENT_REQUIRED || detail.contains("insufficient_quota") {
        return format!("Your {name} account is out of credits or quota. Add some, or use a key from another provider.");
    }
    if status == StatusCode::NOT_FOUND {
        let env = provider.model_env();
        return format!("{name} has no model \"{model}\" available to this key. Set {env} on the backend to one it can use.");
    }
    if status == StatusCode::TOO_MANY_REQUESTS {
        return format!("{name} is rate limiting this key right now. Try again in a moment.");
    }
    if status == StatusCode::FORBIDDEN {
        return format!("{name} declined this request.");
    }
    match provider_message(detail) {
        Some(message) => format!(
            "{name} returned an error (HTTP {}): {}",
            status.as_u16(),
            truncate(&mask_key(&message, key), 400)
        ),
        None => format!("{name} returned an error (HTTP {}). Try again in a moment.", status.as_u16()),
    }
}

pub fn mask_key(text: &str, key: &str) -> String {
    text.replace(key, "[your key]")
}

pub fn truncate(s: &str, max: usize) -> &str {
    match s.char_indices().nth(max) {
        Some((i, _)) => &s[..i],
        None => s,
    }
}

fn provider_message(detail: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(detail).ok()?;
    let value = value.as_array().and_then(|a| a.first()).unwrap_or(&value);
    let message = value.get("error")?.get("message")?.as_str()?.trim();
    (!message.is_empty()).then(|| message.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn describes_provider_errors() {
        let describe = |p: Provider, s: u16, body: &str| {
            describe(p, KeySource::Visitor, StatusCode::from_u16(s).unwrap(), body, "AQ.secret", "some-model")
        };
        assert!(describe(Provider::OpenAi, 401, "").starts_with("Your OpenAI API key was rejected"));
        assert!(describe(Provider::Gemini, 400, r#"{"reason":"API_KEY_INVALID"}"#).starts_with("Your Gemini API key was rejected"));
        assert!(describe(Provider::OpenRouter, 402, "").contains("out of credits"));
        assert!(describe(Provider::OpenAi, 429, r#"{"code":"insufficient_quota"}"#).contains("out of credits"));
        assert!(describe(Provider::Anthropic, 404, "").contains("ANTHROPIC_MODEL"));
        assert!(describe(Provider::Anthropic, 404, "").contains("\"some-model\""));
        assert!(describe(Provider::OpenRouter, 403, "").contains("declined"));
        assert_eq!(describe(Provider::Gemini, 500, ""), "Gemini returned an error (HTTP 500). Try again in a moment.");
        let overloaded = r#"{"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}"#;
        assert_eq!(
            describe(Provider::Gemini, 503, overloaded),
            "Gemini returned an error (HTTP 503): The model is overloaded. Please try again later."
        );
        let wrapped = r#"[{"error":{"message":"bad field for AQ.secret"}}]"#;
        assert_eq!(describe(Provider::Gemini, 400, wrapped), "Gemini returned an error (HTTP 400): bad field for [your key]");
    }

    #[test]
    fn masks_key_and_truncates_on_char_boundaries() {
        assert_eq!(mask_key("echo sk-abc sk-abc", "sk-abc"), "echo [your key] [your key]");
        assert_eq!(truncate("héllo", 2), "hé");
        assert_eq!(truncate("hi", 10), "hi");
    }
}
