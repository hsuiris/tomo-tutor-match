import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// ponytail: 三類動態頁各取最新 500 筆；超過時再換 generateSitemaps 分檔
const LIMIT = 500;

// 預設會在 build 時 prerender；改成每小時重生，新內容才進得了 sitemap
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tutors, jobs, posts] = await Promise.all([
    db.tutorProfile.findMany({
      where: { isPublished: true },
      select: { userId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
    }),
    db.jobPost.findMany({
      where: { status: "OPEN" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
    }),
    db.forumPost.findMany({
      select: { id: true, board: true, lastReplyAt: true },
      orderBy: { lastReplyAt: "desc" },
      take: LIMIT,
    }),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/tutors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/forum`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/forum/tutor`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/forum/parent`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/stats`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/register`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...statics,
    ...tutors.map((t) => ({
      url: `${siteUrl}/u/${t.userId}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...jobs.map((j) => ({
      url: `${siteUrl}/jobs/${j.id}`,
      lastModified: j.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${siteUrl}/forum/${p.board.toLowerCase()}/${p.id}`,
      lastModified: p.lastReplyAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
