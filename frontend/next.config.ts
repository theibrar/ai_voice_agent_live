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
} as NextConfig;

export default nextConfig;
