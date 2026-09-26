mod ai;
mod config;
mod rate_limit;
mod routes;

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post};
use tracing_subscriber::EnvFilter;

use crate::ai::client::AiClient;
use crate::config::Config;
use crate::rate_limit::RateLimiter;

pub struct AppState {
    pub config: Config,
    pub ai: AiClient,
    pub limiter: RateLimiter,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let config = Config::from_env();
    let ai = AiClient::new(&config);
    match ai.fallback_provider() {
        Some(provider) => tracing::info!(provider = provider.name(), "requests without a key use the FALLBACK_API_KEY"),
        None => tracing::info!("no FALLBACK_API_KEY; C and Rust runs need the visitor's own key"),
    }

    let state = Arc::new(AppState {
        ai,
        limiter: RateLimiter::new(
            Duration::from_secs(60),
            config.rate_limit_per_minute,
            config.rate_limit_global_per_minute,
        ),
        config,
    });

    let addr = format!("{}:{}", state.config.host, state.config.port);
    tracing::info!(
        anthropic = %state.config.anthropic_model,
        openai = %state.config.openai_model,
        gemini = %state.config.gemini_model,
        openrouter = %state.config.openrouter_model,
        "listening on http://{addr}"
    );

    let app = Router::new()
        .route("/api/execute", post(routes::execute::execute))
        .route("/healthz", get(|| async { "ok" }))
        .layer(DefaultBodyLimit::max(256 * 1024))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&addr).await.expect("failed to bind");
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c().await.ok();
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(_) => std::future::pending::<()>().await,
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
}
