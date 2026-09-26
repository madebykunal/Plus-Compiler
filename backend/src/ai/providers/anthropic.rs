use reqwest::{Client, RequestBuilder};
use serde::Deserialize;
use serde_json::json;

use super::{Prompt, Reply, reply_schema};
use crate::config::Config;

const VERSION: &str = "2023-06-01";
const FALLBACKS_BETA: &str = "server-side-fallback-2026-07-01";
const MAX_TOKENS: u32 = 16_000;

pub fn request(http: &Client, config: &Config, key: &str, prompt: &Prompt) -> RequestBuilder {
    let mut body = json!({
        "model": config.anthropic_model,
        "max_tokens": MAX_TOKENS,
        "system": prompt.system,
        "messages": [{ "role": "user", "content": prompt.user }],
        "output_config": {
            "effort": config.anthropic_effort,
            "format": { "type": "json_schema", "schema": reply_schema() },
        },
    });

    let mut request = http
        .post(format!("{}/v1/messages", config.anthropic_base_url))
        .header("x-api-key", key)
        .header("anthropic-version", VERSION);
    if let Some(fallbacks) = &config.anthropic_fallbacks {
        body["fallbacks"] = json!(fallbacks);
        request = request.header("anthropic-beta", FALLBACKS_BETA);
    }
    request.json(&body)
}

#[derive(Deserialize)]
struct Message {
    #[serde(default)]
    content: Vec<ContentBlock>,
    stop_reason: Option<String>,
}

#[derive(Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    kind: String,
    text: Option<String>,
}

pub fn read(body: &[u8]) -> Option<Reply> {
    let message: Message = serde_json::from_slice(body).ok()?;
    Some(match message.stop_reason.as_deref() {
        Some("refusal") => Reply::Refused,
        Some("max_tokens") => Reply::Truncated,
        _ => Reply::Text(
            message
                .content
                .iter()
                .filter(|b| b.kind == "text")
                .filter_map(|b| b.text.as_deref())
                .collect(),
        ),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_text_and_skips_thinking() {
        let body = br#"{"stop_reason":"end_turn","content":[{"type":"thinking","thinking":"..."},{"type":"text","text":"{\"status\":\"ok\",\"output\":\"hi\"}"}]}"#;
        assert_eq!(read(body), Some(Reply::Text(r#"{"status":"ok","output":"hi"}"#.into())));
    }

    #[test]
    fn maps_refusal_and_truncation() {
        assert_eq!(read(br#"{"stop_reason":"refusal","content":[]}"#), Some(Reply::Refused));
        assert_eq!(read(br#"{"stop_reason":"max_tokens","content":[]}"#), Some(Reply::Truncated));
        assert_eq!(read(b"not json"), None);
    }
}
