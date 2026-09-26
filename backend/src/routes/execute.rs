use std::net::SocketAddr;
use std::sync::Arc;

use axum::Json;
use axum::extract::rejection::JsonRejection;
use axum::extract::{ConnectInfo, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use serde::Deserialize;

use super::headers::{client_key, user_api_key};
use crate::AppState;
use crate::ai::errors::UNKNOWN_KEY;
use crate::ai::{Language, Provider, RunResult};

const MAX_STDIN_CHARS: usize = 10_000;

#[derive(Deserialize)]
pub struct ExecuteRequest {
    language: String,
    code: String,
    #[serde(default)]
    stdin: Option<String>,
}

pub async fn execute(
    State(state): State<Arc<AppState>>,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    body: Result<Json<ExecuteRequest>, JsonRejection>,
) -> Response {
    let Json(req) = match body {
        Ok(body) => body,
        Err(rejection) => return bad_request(format!("Invalid request: {}", rejection.body_text())),
    };

    let language = match req.language.as_str() {
        "c" => Language::C,
        "rust" => Language::Rust,
        other => return bad_request(format!("Unsupported language \"{other}\". Expected \"c\" or \"rust\".")),
    };
    if req.code.trim().is_empty() {
        return bad_request("Nothing to run, the editor is empty.");
    }
    let code_chars = req.code.chars().count();
    if code_chars > state.config.max_code_chars {
        return bad_request(format!(
            "Code is {code_chars} characters, the limit is {}. Try a smaller snippet.",
            state.config.max_code_chars
        ));
    }
    let stdin = req.stdin.unwrap_or_default();
    if stdin.chars().count() > MAX_STDIN_CHARS {
        return bad_request(format!("stdin is over the {MAX_STDIN_CHARS} character limit."));
    }
    let user_key = match user_api_key(&headers) {
        Ok(key) => key,
        Err(()) => return bad_request("That API key isn't valid. Paste it again with the key icon on the right."),
    };
    if user_key.is_some_and(|key| Provider::detect(key).is_none()) {
        return bad_request(UNKNOWN_KEY);
    }

    let key = client_key(&headers, peer);
    if let Err(wait) = state.limiter.check(&key) {
        let secs = wait.as_secs().max(1);
        tracing::info!(%key, secs, "rate limited");
        let mut res = (
            StatusCode::TOO_MANY_REQUESTS,
            Json(RunResult::runtime_error(format!(
                "Too many runs in a short time. Try again in {secs}s."
            ))),
        )
            .into_response();
        res.headers_mut().insert(header::RETRY_AFTER, HeaderValue::from(secs));
        return res;
    }

    let started = std::time::Instant::now();
    let result = state.ai.simulate(language, &req.code, &stdin, user_key).await;
    tracing::info!(?language, status = ?result.status, elapsed_ms = started.elapsed().as_millis() as u64, "run finished");
    Json(result).into_response()
}

fn bad_request(message: impl Into<String>) -> Response {
    (StatusCode::BAD_REQUEST, Json(RunResult::runtime_error(message))).into_response()
}
