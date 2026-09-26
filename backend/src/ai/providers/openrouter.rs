use reqwest::{Client, RequestBuilder};
use serde::Deserialize;
use serde_json::json;

use super::{MAX_OUTPUT_TOKENS, Prompt, Reply, reply_schema};
use crate::config::Config;

pub fn request(http: &Client, config: &Config, key: &str, prompt: &Prompt) -> RequestBuilder {
    let body = json!({
        "model": config.openrouter_model,
        "messages": [
            { "role": "system", "content": prompt.system },
            { "role": "user", "content": prompt.user },
        ],
        "max_tokens": MAX_OUTPUT_TOKENS,
        "response_format": {
            "type": "json_schema",
            "json_schema": { "name": "run_result", "strict": true, "schema": reply_schema() },
        },
        "provider": { "require_parameters": true },
    });
    http.post(format!("{}/v1/chat/completions", config.openrouter_base_url)).bearer_auth(key).json(&body)
}

#[derive(Deserialize)]
struct Completion {
    #[serde(default)]
    choices: Vec<Choice>,
    error: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct Choice {
    message: Option<Message>,
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct Message {
    content: Option<String>,
    refusal: Option<String>,
}

pub fn read(body: &[u8]) -> Option<Reply> {
    let completion: Completion = serde_json::from_slice(body).ok()?;
    if completion.error.is_some() {
        return Some(Reply::Failed);
    }
    let choice = completion.choices.into_iter().next()?;
    let message = choice.message.unwrap_or(Message { content: None, refusal: None });
    Some(match choice.finish_reason.as_deref() {
        _ if message.refusal.is_some() => Reply::Refused,
        Some("content_filter") => Reply::Refused,
        Some("length") => Reply::Truncated,
        Some("error") => Reply::Failed,
        _ => Reply::Text(message.content.unwrap_or_default()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_message_content() {
        let body = br#"{"choices":[{"finish_reason":"stop","message":{"role":"assistant","content":"{\"status\":\"ok\",\"output\":\"1\"}"}}]}"#;
        assert_eq!(read(body), Some(Reply::Text(r#"{"status":"ok","output":"1"}"#.into())));
    }

    #[test]
    fn maps_finish_reasons_and_errors() {
        assert_eq!(read(br#"{"choices":[{"finish_reason":"length","message":{"content":"{"}}]}"#), Some(Reply::Truncated));
        assert_eq!(read(br#"{"choices":[{"finish_reason":"content_filter","message":{"content":null}}]}"#), Some(Reply::Refused));
        assert_eq!(read(br#"{"error":{"code":502,"message":"upstream"}}"#), Some(Reply::Failed));
        assert_eq!(read(br#"{"choices":[]}"#), None);
    }
}
