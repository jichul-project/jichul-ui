import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 개발 환경에서는 SW 비활성화
});

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
