import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:8080").replace(/\/+$/, "");
const isProduction = process.env.NODE_ENV === "production";

const appCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/execute", destination: `${backendUrl}/api/execute` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        source: "/:path((?!preview\\.html$).*)",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
      ...(isProduction
        ? [
            {
              source: "/:path((?!preview\\.html$).*)",
              headers: [{ key: "Content-Security-Policy", value: appCsp }],
            },
          ]
        : []),
      {
        source: "/preview.html",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads; frame-ancestors 'self'",
          },
        ],
      },
      {
        source: "/api/execute",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/monaco/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  experimental: {
    proxyTimeout: 180_000,
  },
};

export default nextConfig;
