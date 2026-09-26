use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;
use std::time::{Duration, Instant};

const GLOBAL_KEY: &str = "*";

pub struct RateLimiter {
    window: Duration,
    per_session: u32,
    global: u32,
    hits: Mutex<HashMap<String, VecDeque<Instant>>>,
}

impl RateLimiter {
    pub fn new(window: Duration, per_session: u32, global: u32) -> Self {
        Self { window, per_session, global, hits: Mutex::new(HashMap::new()) }
    }

    pub fn check(&self, key: &str) -> Result<(), Duration> {
        self.check_at(key, Instant::now())
    }

    fn check_at(&self, key: &str, now: Instant) -> Result<(), Duration> {
        let mut hits = self.hits.lock().unwrap_or_else(|e| e.into_inner());

        if hits.len() > 10_000 {
            hits.retain(|_, q| q.back().is_some_and(|t| now.duration_since(*t) < self.window));
        }

        for (k, limit) in [(key, self.per_session), (GLOBAL_KEY, self.global)] {
            let q = hits.entry(k.to_string()).or_default();
            while q.front().is_some_and(|t| now.duration_since(*t) >= self.window) {
                q.pop_front();
            }
            if q.len() >= limit as usize {
                let oldest = *q.front().expect("non-empty when at limit");
                return Err(self.window.saturating_sub(now.duration_since(oldest)));
            }
        }

        hits.entry(key.to_string()).or_default().push_back(now);
        hits.entry(GLOBAL_KEY.to_string()).or_default().push_back(now);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn limits_per_session_and_recovers() {
        let rl = RateLimiter::new(Duration::from_secs(60), 2, 100);
        let t0 = Instant::now();
        assert!(rl.check_at("a", t0).is_ok());
        assert!(rl.check_at("a", t0).is_ok());
        let wait = rl.check_at("a", t0 + Duration::from_secs(10)).unwrap_err();
        assert_eq!(wait, Duration::from_secs(50));
        assert!(rl.check_at("b", t0).is_ok());
        assert!(rl.check_at("a", t0 + Duration::from_secs(61)).is_ok());
    }

    #[test]
    fn global_cap_applies_across_sessions() {
        let rl = RateLimiter::new(Duration::from_secs(60), 10, 2);
        let t0 = Instant::now();
        assert!(rl.check_at("a", t0).is_ok());
        assert!(rl.check_at("b", t0).is_ok());
        assert!(rl.check_at("c", t0).is_err());
    }
}
