import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ProfileForm, { type ProfileInitial } from "@/components/ProfileForm";
import type { TeachingMode } from "@/lib/constants";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "TUTOR") {
    // 學生沒有老師檔案
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        只有家教老師可以編輯檔案。
      </div>
    );
  }

  const profile = await db.tutorProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, gender: true, avatarUrl: true } } },
  });

  // 註冊時已建立空白檔案，理論上一定存在
  if (!profile) redirect("/dashboard");

  const initial: ProfileInitial = {
    name: profile.user.name,
    bio: profile.bio ?? "",
    subjects: profile.subjects,
    levels: profile.levels,
    regions: profile.regions,
    hourlyRate: profile.hourlyRate?.toString() ?? "",
    experience: profile.experience ?? "",
    education: profile.education ?? "",
    university: profile.university ?? "",
    eduLevel: profile.eduLevel ?? "",
    mode: profile.mode as TeachingMode,
    gender: profile.user.gender as ProfileInitial["gender"],
    avatarUrl: profile.user.avatarUrl ?? "",
    isPublished: profile.isPublished,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-ink">
            編輯老師檔案
          </h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
        </div>
        {profile.isPublished && (
          <Link
            href={`/tutors/${profile.id}`}
            className="text-sm font-bold text-cobalt hover:underline"
          >
            預覽公開頁面 →
          </Link>
        )}
      </div>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        填寫越完整,越容易被學生找到並信任。
      </p>
      <ProfileForm initial={initial} />
    </div>
  );
}
