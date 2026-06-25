import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Turbopack 的 filesystem root 明確固定到專案目錄。
  // 自動推論失敗時會出現「Next.js package not found」panic。
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    // 頭像以 base64 data URL 透過 server action 上傳，放寬 body 上限
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
