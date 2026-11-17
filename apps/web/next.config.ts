import type { NextConfig } from "next";

const internalApi = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The API is a separate NestJS process. Everything the browser sends to
  // /api/* is rewritten to it so cookies stay first-party and no CORS
  // preflight ever happens (T2.3).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApi}/api/:path*`
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" }
        ]
      },
      {
        // Private surfaces must never be cached by a shared cache.
        source: "/(dashboard|journal|calendar|voice-journal|insights|settings|profile)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      }
    ];
  },
  poweredByHeader: false,
  experimental: {
    // Shared package ships plain CommonJS output; no transpile step needed.
    optimizePackageImports: ["lucide-react", "framer-motion"]
  }
};

export default nextConfig;
