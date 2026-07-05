// 站台正式網址（絕對 URL 的單一來源：sitemap、OG、重設密碼信都用它）。
// 優先吃 NEXT_PUBLIC_SITE_URL（自訂網域），否則退回 Vercel 正式網域、本機開發位址。
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
