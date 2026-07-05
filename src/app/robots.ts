import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 需登入或含個資的區域不給爬
      disallow: ["/admin", "/dashboard", "/messages", "/favorites", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
