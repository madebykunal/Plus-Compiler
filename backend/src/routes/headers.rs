use std::net::SocketAddr;

use axum::http::HeaderMap;

pub const MAX_API_KEY_CHARS: usize = 256;

pub fn user_api_key(headers: &HeaderMap) -> Result<Option<&str>, ()> {
    let Some(value) = headers.get("x-api-key") else { return Ok(None) };
    let key = value.to_str().map_err(|_| ())?.trim();
    if key.is_empty() {
        return Ok(None);
    }
    if key.len() > MAX_API_KEY_CHARS || !key.chars().all(|c| c.is_ascii_graphic()) {
        return Err(());
    }
    Ok(Some(key))
}

pub fn client_key(headers: &HeaderMap, peer: SocketAddr) -> String {
    let header = |name: &str| headers.get(name).and_then(|v| v.to_str().ok()).map(str::trim);

    if let Some(id) = header("x-session-id")
        .filter(|id| !id.is_empty() && id.len() <= 64 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-'))
    {
        return format!("session:{id}");
    }
    if let Some(ip) = header("x-forwarded-for").and_then(|v| v.split(',').next()).map(str::trim).filter(|v| !v.is_empty()) {
        return format!("ip:{ip}");
    }
    format!("ip:{}", peer.ip())
}

#[cfg(test)]
mod tests {
    use axum::http::HeaderValue;

    use super::*;

    fn with(name: &'static str, value: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(name, HeaderValue::from_str(value).unwrap());
        headers
    }

    #[test]
    fn reads_user_api_key() {
        assert_eq!(user_api_key(&HeaderMap::new()), Ok(None));
        assert_eq!(user_api_key(&with("x-api-key", "  ")), Ok(None));
        assert_eq!(user_api_key(&with("x-api-key", " sk-ant-abc123 ")), Ok(Some("sk-ant-abc123")));
        assert_eq!(user_api_key(&with("x-api-key", "sk ant")), Err(()));
        assert_eq!(user_api_key(&with("x-api-key", &"k".repeat(MAX_API_KEY_CHARS + 1))), Err(()));
    }

    #[test]
    fn picks_session_then_forwarded_then_peer() {
        let peer: SocketAddr = "10.0.0.1:1234".parse().unwrap();
        assert_eq!(client_key(&with("x-session-id", "abc-123"), peer), "session:abc-123");
        assert_eq!(client_key(&with("x-session-id", "bad id!"), peer), "ip:10.0.0.1");
        assert_eq!(client_key(&with("x-forwarded-for", "1.2.3.4, 5.6.7.8"), peer), "ip:1.2.3.4");
        assert_eq!(client_key(&HeaderMap::new(), peer), "ip:10.0.0.1");
    }
}
