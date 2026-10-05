import type { NextConfig } from "next";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",

  // 브라우저에서 /api/** 로 요청하면 Next 서버가 Spring Boot로 대신 전달합니다.
  // → 백엔드 주소를 숨길 수 있고, 개발 중 CORS 문제도 피할 수 있습니다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
