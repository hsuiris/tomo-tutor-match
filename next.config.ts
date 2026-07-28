import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Turbopack 的 filesystem root 明確固定到專案目錄。
  // 自動推論失敗時會出現「Next.js package not found」panic。
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    // 頭像／檔案照片以 base64 data URL 透過 server action 上傳，放寬 body 上限
    // （檔案照片最多 5 張 × 800KB，base64 後約 5.3MB）
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  // 安全標頭，套用到所有路由。
  // ponytail: 先上低風險、高價值的標頭；嚴格 CSP 需要 nonce 串接 proxy.ts，
  //           易在上線時打爆整站，待測試環境驗證後再開（見 DEPLOYMENT.md）。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
