use super::errors::{UNREADABLE, truncate, unavailable};
use super::providers::Reply;
use super::{Provider, RunResult};

pub fn interpret(provider: Provider, reply: Option<Reply>, body: &[u8]) -> RunResult {
    let text = match reply {
        Some(Reply::Text(text)) => text,
        Some(Reply::Refused) => {
            tracing::warn!(provider = provider.name(), "provider declined the request");
            return RunResult::runtime_error("The compiler simulator declined to run this code.");
        }
        Some(Reply::Truncated) => {
            tracing::warn!(provider = provider.name(), "provider reply hit the token limit");
            return RunResult::runtime_error(
                "The simulated output was too long to finish. Try a program that prints less.",
            );
        }
        Some(Reply::Failed) => {
            tracing::warn!(provider = provider.name(), body = %truncate(&String::from_utf8_lossy(body), 500), "provider reported a failure");
            return RunResult::runtime_error(unavailable(provider));
        }
        None => {
            tracing::error!(provider = provider.name(), body = %truncate(&String::from_utf8_lossy(body), 500), "unexpected provider response");
            return RunResult::runtime_error(UNREADABLE);
        }
    };

    parse_reply(&text).unwrap_or_else(|| {
        tracing::error!(provider = provider.name(), reply = %truncate(&text, 500), "model reply was not valid result JSON");
        RunResult::runtime_error(UNREADABLE)
    })
}

fn parse_reply(text: &str) -> Option<RunResult> {
    if let Ok(result) = serde_json::from_str::<RunResult>(text.trim()) {
        return Some(result);
    }
    let start = text.find('{')?;
    let end = text.rfind('}')?;
    serde_json::from_str::<RunResult>(text.get(start..=end)?).ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::Status;

    #[test]
    fn parses_fenced_reply() {
        let r = parse_reply("```json\n{\"status\": \"ok\", \"output\": \"hi\\n\"}\n```").unwrap();
        assert_eq!(r, RunResult { status: Status::Ok, output: "hi\n".into() });
    }

    #[test]
    fn rejects_bad_replies() {
        assert!(parse_reply("not json").is_none());
        assert!(parse_reply(r#"{"status":"maybe","output":""}"#).is_none());
        assert!(parse_reply(r#"{"status":"ok"}"#).is_none());
        let r = interpret(Provider::OpenAi, Some(Reply::Text("garbage".into())), b"");
        assert_eq!(r.status, Status::RuntimeError);
        assert_eq!(r.output, UNREADABLE);
    }

    #[test]
    fn maps_reply_kinds() {
        let ok = interpret(Provider::Gemini, Some(Reply::Text(r#"{"status":"compile_error","output":"e"}"#.into())), b"");
        assert_eq!(ok, RunResult { status: Status::CompileError, output: "e".into() });
        for reply in [Reply::Refused, Reply::Truncated, Reply::Failed] {
            assert_eq!(interpret(Provider::Anthropic, Some(reply), b"").status, Status::RuntimeError);
        }
        assert_eq!(interpret(Provider::OpenRouter, None, b"{}").output, UNREADABLE);
    }
}
