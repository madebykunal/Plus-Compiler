use reqwest::{Client, RequestBuilder};
use serde::Deserialize;
use serde_json::json;

use super::{MAX_OUTPUT_TOKENS, Prompt, Reply, reply_schema};
use crate::config::Config;

pub fn request(http: &Client, config: &Config, key: &str, prompt: &Prompt) -> RequestBuilder {
    let mut body = json!({
        "model": config.openai_model,
        "instructions": prompt.system,
        "input": prompt.user,
        "max_output_tokens": MAX_OUTPUT_TOKENS,
        "store": false,
        "text": {
            "format": { "type": "json_schema", "name": "run_result", "strict": true, "schema": reply_schema() },
        },
    });
    if let Some(effort) = &config.openai_effort {
        body["reasoning"] = json!({ "effort": effort });
    }
    http.post(format!("{}/v1/responses", config.openai_base_url)).bearer_auth(key).json(&body)
}

#[derive(Deserialize)]
struct Response {
    status: Option<String>,
    incomplete_details: Option<Incomplete>,
    #[serde(default)]
    output: Vec<OutputItem>,
}

#[derive(Deserialize)]
struct Incomplete {
    reason: Option<String>,
}

#[derive(Deserialize)]
struct OutputItem {
    #[serde(rename = "type")]
    kind: String,
    #[serde(default)]
    content: Vec<Content>,
}

#[derive(Deserialize)]
struct Content {
    #[serde(rename = "type")]
    kind: String,
    text: Option<String>,
}

pub fn read(body: &[u8]) -> Option<Reply> {
    let response: Response = serde_json::from_slice(body).ok()?;
    let content = || response.output.iter().filter(|item| item.kind == "message").flat_map(|item| &item.content);

    if content().any(|c| c.kind == "refusal") {
        return Some(Reply::Refused);
    }
    match response.status.as_deref() {
        Some("incomplete") => {
            let reason = response.incomplete_details.as_ref().and_then(|d| d.reason.as_deref());
            return Some(if reason == Some("content_filter") { Reply::Refused } else { Reply::Truncated });
        }
        Some("failed") | Some("cancelled") => return Some(Reply::Failed),
        _ => {}
    }
    Some(Reply::Text(
        content().filter(|c| c.kind == "output_text").filter_map(|c| c.text.as_deref()).collect(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_output_text_and_skips_reasoning() {
        let body = br#"{"status":"completed","output":[{"type":"reasoning","summary":[]},{"type":"message","content":[{"type":"output_text","text":"{\"status\":\"ok\",\"output\":\"\"}"}]}]}"#;
        assert_eq!(read(body), Some(Reply::Text(r#"{"status":"ok","output":""}"#.into())));
    }

    #[test]
    fn maps_refusal_and_incomplete() {
        let refusal = br#"{"status":"completed","output":[{"type":"message","content":[{"type":"refusal","refusal":"no"}]}]}"#;
        assert_eq!(read(refusal), Some(Reply::Refused));
        let long = br#"{"status":"incomplete","incomplete_details":{"reason":"max_output_tokens"},"output":[]}"#;
        assert_eq!(read(long), Some(Reply::Truncated));
        let filtered = br#"{"status":"incomplete","incomplete_details":{"reason":"content_filter"},"output":[]}"#;
        assert_eq!(read(filtered), Some(Reply::Refused));
    }
}
