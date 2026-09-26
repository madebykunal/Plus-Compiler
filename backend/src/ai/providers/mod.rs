pub mod anthropic;
pub mod gemini;
pub mod openai;
pub mod openrouter;

use serde_json::{Value, json};

pub struct Prompt<'a> {
    pub system: &'a str,
    pub user: &'a str,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Reply {
    Text(String),
    Refused,
    Truncated,
    Failed,
}

pub const MAX_OUTPUT_TOKENS: u32 = 32_000;

pub fn reply_schema() -> Value {
    json!({
        "type": "object",
        "properties": {
            "status": { "type": "string", "enum": ["ok", "compile_error", "runtime_error"] },
            "output": { "type": "string" },
        },
        "required": ["status", "output"],
        "additionalProperties": false,
    })
}
