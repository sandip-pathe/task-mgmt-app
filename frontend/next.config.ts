import type { NextConfig } from "next";

const apiProxyUrl =
  process.env.API_PROXY_URL ?? "https://task-mgmt-app-production.up.railway.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
