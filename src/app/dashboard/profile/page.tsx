import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ProfileForm, { type ProfileInitial } from "@/components/ProfileForm";
import AliasForm from "@/components/AliasForm";
import VerificationSection from "@/components/VerificationSection";
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
    include: {
      user: {
        select: {
          name: true,
          displayName: true,
          gender: true,
          avatarUrl: true,
          idVerified: true,
          bgCheckVerified: true,
          eduVerified: true,
          verificationRequests: { orderBy: { createdAt: "desc" } },
        },
      },
    },
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
    hourlyRateMax: profile.hourlyRateMax?.toString() ?? "",
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
        <Link
          href={`/u/${session.user.id}`}
          target="_blank"
          className="shrink-0 text-sm font-bold text-cobalt hover:underline"
        >
          {profile.isPublished ? "預覽公開頁面 →" : "預覽檔案 →"}
        </Link>
      </div>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        填寫越完整,越容易被學生找到並信任。
      </p>
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <ProfileForm initial={initial} />
      </div>

      {/* 公開化名 */}
      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-bold text-ink">公開化名</h2>
        <p className="mb-4 text-xs text-ink/40">
          你的本名是「{profile.user.name}」,僅平台保留。
        </p>
        <AliasForm displayName={profile.user.displayName ?? ""} />
      </section>

      {/* 安全認證 */}
      <div className="mt-6">
        <VerificationSection
          idVerified={profile.user.idVerified}
          bgCheckVerified={profile.user.bgCheckVerified}
          eduVerified={profile.user.eduVerified}
          requests={profile.user.verificationRequests}
          showEducation
          intro="完成認證後,你的檔案會顯示信任徽章,讓家長更放心託付,也保障你接案的安全。證件僅供審核,審核後即刪除。"
        />
      </div>
    </div>
  );
}
