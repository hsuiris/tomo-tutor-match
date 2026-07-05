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

  // 還不是老師（沒有檔案）→ 回面板用「成為老師」升級
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
        <ProfileForm
          initial={initial}
          aliasSlot={
            <div className="border-t border-line/60 pt-5">
              <h2 className="mb-1 font-bold text-ink">公開顯示名稱</h2>
              <p className="mb-3 text-xs text-ink/40">
                可選擇對外顯示化名或本名。
              </p>
              <AliasForm
                displayName={profile.user.displayName ?? ""}
                realName={profile.user.name}
              />
            </div>
          }
        />
      </div>

      {/* 安全認證 */}
      <div className="mt-6">
        <VerificationSection
          idVerified={profile.user.idVerified}
          bgCheckVerified={profile.user.bgCheckVerified}
          eduVerified={profile.user.eduVerified}
          requests={profile.user.verificationRequests}
          showEducation
          intro="安全認證為選填，沒有認證也能正常刊登檔案與應徵案件；但完成認證會顯示信任徽章，家長與老師雙方都會更放心。證件僅供審核，審核後即刪除。"
        />
      </div>
    </div>
  );
}
