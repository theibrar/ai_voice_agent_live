import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "agents.ibrasoft.com",
    "*.ibrasoft.com",
    "150.136.115.51",
    "localhost:3000",
    "localhost:8080",
    "localhost",
    "127.0.0.1",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendHost =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production" ? "http://backend:8080" : "http://localhost:8080");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendHost}/api/v1/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendHost}/ws/:path*`,
      },
      {
        source: "/api/simulator/:path*",
        destination: `${backendHost}/api/simulator/:path*`,
      },
      {
        source: "/api/tts/:path*",
        destination: `${backendHost}/api/tts/:path*`,
      },
    ];
  },
} as NextConfig;

export default nextConfig;
