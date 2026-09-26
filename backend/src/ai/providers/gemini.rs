use reqwest::{Client, RequestBuilder};
use serde::Deserialize;
use serde_json::json;

use super::{MAX_OUTPUT_TOKENS, Prompt, Reply, reply_schema};
use crate::config::Config;

pub fn request(http: &Client, config: &Config, key: &str, prompt: &Prompt) -> RequestBuilder {
    let mut schema = reply_schema();
    if let Some(object) = schema.as_object_mut() {
        object.remove("additionalProperties");
    }

    let body = json!({
        "systemInstruction": { "parts": [{ "text": prompt.system }] },
        "contents": [{ "role": "user", "parts": [{ "text": prompt.user }] }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": schema,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    });
    http.post(format!("{}/v1beta/models/{}:generateContent", config.gemini_base_url, config.gemini_model))
        .header("x-goog-api-key", key)
        .json(&body)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    #[serde(default)]
    candidates: Vec<Candidate>,
    prompt_feedback: Option<PromptFeedback>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PromptFeedback {
    block_reason: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Candidate {
    content: Option<Content>,
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct Content {
    #[serde(default)]
    parts: Vec<Part>,
}

#[derive(Deserialize)]
struct Part {
    text: Option<String>,
    #[serde(default)]
    thought: bool,
}

pub fn read(body: &[u8]) -> Option<Reply> {
    let response: Response = serde_json::from_slice(body).ok()?;
    if response.prompt_feedback.and_then(|f| f.block_reason).is_some() {
        return Some(Reply::Refused);
    }
    let candidate = response.candidates.into_iter().next()?;
    Some(match candidate.finish_reason.as_deref() {
        Some("MAX_TOKENS") => Reply::Truncated,
        Some("SAFETY" | "RECITATION" | "BLOCKLIST" | "PROHIBITED_CONTENT" | "SPII" | "IMAGE_SAFETY") => Reply::Refused,
        _ => Reply::Text(
            candidate
                .content
                .map(|c| c.parts.into_iter().filter(|p| !p.thought).filter_map(|p| p.text).collect())
                .unwrap_or_default(),
        ),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_answer_parts_and_skips_thoughts() {
        let body = br#"{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"thinking...","thought":true},{"text":"{\"status\":\"ok\",\"output\":\"x\"}"}]}}]}"#;
        assert_eq!(read(body), Some(Reply::Text(r#"{"status":"ok","output":"x"}"#.into())));
    }

    #[test]
    fn maps_blocks_and_truncation() {
        assert_eq!(read(br#"{"promptFeedback":{"blockReason":"SAFETY"}}"#), Some(Reply::Refused));
        assert_eq!(read(br#"{"candidates":[{"finishReason":"MAX_TOKENS","content":{"parts":[]}}]}"#), Some(Reply::Truncated));
        assert_eq!(read(br#"{"candidates":[{"finishReason":"SAFETY"}]}"#), Some(Reply::Refused));
        assert_eq!(read(br#"{"candidates":[]}"#), None);
    }
}
