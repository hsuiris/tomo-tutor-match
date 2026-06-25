import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

// 老師詳情統一導向個人檔案頁 /u/[userId]
export default async function TutorRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await db.tutorProfile.findUnique({
    where: { id },
    select: { userId: true, isPublished: true },
  });
  if (!profile || !profile.isPublished) notFound();
  redirect(`/u/${profile.userId}`);
}
