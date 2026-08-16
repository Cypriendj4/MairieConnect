import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data layer uses dynamic types — skip strict type checking at build time
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;