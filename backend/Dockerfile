FROM rust:1-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends cmake && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/plus-compiler-backend /usr/local/bin/plus-compiler-backend
ENV HOST=0.0.0.0 PORT=8080 RUST_LOG=info
USER nobody
EXPOSE 8080
CMD ["plus-compiler-backend"]
