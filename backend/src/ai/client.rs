use std::time::Duration;

use reqwest::StatusCode;

use super::errors::{self, KeySource, NO_KEY, UNKNOWN_KEY, mask_key, truncate};
use super::providers::{self, Prompt};
use super::{Language, Provider, RunResult, prompt, reply};
use crate::config::Config;

const MAX_ATTEMPTS: u32 = 3;

#[derive(Clone)]
pub struct AiClient {
    http: reqwest::Client,
    config: Config,
    fallback: Option<(Provider, String)>,
}

impl AiClient {
    pub fn new(config: &Config) -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(170))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .expect("failed to build HTTP client");
        let fallback = config.fallback_api_key.as_ref().and_then(|key| match Provider::detect(key) {
            Some(provider) => Some((provider, key.clone())),
            None => {
                tracing::warn!("FALLBACK_API_KEY is not a recognized OpenAI, Anthropic, Gemini or OpenRouter key; ignoring it");
                None
            }
        });
        Self { http, config: config.clone(), fallback }
    }

    pub fn fallback_provider(&self) -> Option<Provider> {
        self.fallback.as_ref().map(|(provider, _)| *provider)
    }

    pub async fn simulate(&self, language: Language, code: &str, stdin: &str, user_key: Option<&str>) -> RunResult {
        let (provider, key, source) = match user_key {
            Some(key) => match Provider::detect(key) {
                Some(provider) => (provider, key, KeySource::Visitor),
                None => return RunResult::runtime_error(UNKNOWN_KEY),
            },
            None => match &self.fallback {
                Some((provider, key)) => (*provider, key.as_str(), KeySource::Server),
                None => return RunResult::runtime_error(NO_KEY),
            },
        };

        let system = prompt::system_prompt(language);
        let user = prompt::user_message(code, stdin);
        let prompt = Prompt { system: &system, user: &user };
        let request = match provider {
            Provider::Anthropic => providers::anthropic::request(&self.http, &self.config, key, &prompt),
            Provider::OpenAi => providers::openai::request(&self.http, &self.config, key, &prompt),
            Provider::Gemini => providers::gemini::request(&self.http, &self.config, key, &prompt),
            Provider::OpenRouter => providers::openrouter::request(&self.http, &self.config, key, &prompt),
        };

        let mut attempt = 1;
        let response = loop {
            let req = request.try_clone().expect("JSON body is cloneable");
            match req.send().await {
                Ok(res) if res.status().is_success() => break res,
                Ok(res) => {
                    let status = res.status();
                    let retry_after = retry_after(&res);
                    let detail = res.text().await.unwrap_or_default();
                    tracing::warn!(provider = provider.name(), %status, attempt, body = %truncate(&mask_key(&detail, key), 500), "provider returned an error");
                    if attempt < MAX_ATTEMPTS && is_retryable(status, &detail) {
                        attempt += 1;
                        tokio::time::sleep(retry_after).await;
                        continue;
                    }
                    let model = self.config.model_for(provider);
                    return RunResult::runtime_error(errors::describe(provider, source, status, &detail, key, model));
                }
                Err(err) => {
                    let timed_out = err.is_timeout();
                    tracing::warn!(provider = provider.name(), error = %err.without_url(), attempt, "provider request failed");
                    if attempt < MAX_ATTEMPTS && !timed_out {
                        attempt += 1;
                        tokio::time::sleep(Duration::from_secs(1)).await;
                        continue;
                    }
                    return RunResult::runtime_error(errors::unreachable(provider, timed_out));
                }
            }
        };

        let body = match response.bytes().await {
            Ok(body) => body,
            Err(err) => {
                tracing::error!(provider = provider.name(), error = %err.without_url(), "could not read provider response");
                return RunResult::runtime_error(errors::unavailable(provider));
            }
        };
        let parsed = match provider {
            Provider::Anthropic => providers::anthropic::read(&body),
            Provider::OpenAi => providers::openai::read(&body),
            Provider::Gemini => providers::gemini::read(&body),
            Provider::OpenRouter => providers::openrouter::read(&body),
        };
        reply::interpret(provider, parsed, &body)
    }
}

fn is_retryable(status: StatusCode, detail: &str) -> bool {
    if detail.contains("insufficient_quota") {
        return false;
    }
    status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error() || status.as_u16() == 529
}

fn retry_after(res: &reqwest::Response) -> Duration {
    let secs = res
        .headers()
        .get("retry-after")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(1);
    Duration::from_secs(secs.clamp(1, 5))
}
