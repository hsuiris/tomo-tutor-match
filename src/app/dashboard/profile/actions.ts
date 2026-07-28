"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";
import { hasTutorProfile } from "@/lib/tutor";
import { parseExams, parseRateRules, parseAvailability } from "@/lib/profile-detail";
import type { ActionState } from "@/lib/types";

// 安全解析 hidden input 的 JSON（失敗回 undefined，維持不動）
function safeJson(v: FormDataEntryValue | null): unknown {
  if (typeof v !== "string" || !v) return undefined;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await hasTutorProfile(session.user.id))) {
    return { error: "沒有權限" };
  }

  const rateRaw = formData.get("hourlyRate")?.toString().trim();
  const rateMaxRaw = formData.get("hourlyRateMax")?.toString().trim();
  const avatarRaw = formData.get("avatarUrl")?.toString();
  const raw = {
    bio: formData.get("bio")?.toString().trim() ?? "",
    subjects: formData.getAll("subjects").map(String),
    levels: formData.getAll("levels").map(String),
    regions: formData.getAll("regions").map(String),
    hourlyRate: rateRaw ? Number(rateRaw) : undefined,
    hourlyRateMax: rateMaxRaw ? Number(rateMaxRaw) : undefined,
    experience: formData.get("experience")?.toString().trim() ?? "",
    education: formData.get("education")?.toString().trim() ?? "",
    university: formData.get("university")?.toString().trim() ?? "",
    eduLevel: formData.get("eduLevel")?.toString().trim() || undefined,
    mode: formData.get("mode")?.toString(),
    gender: formData.get("gender")?.toString(),
    avatarUrl: avatarRaw || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      // 回填使用者剛輸入的值，避免出錯後被清空
      values: {
        bio: raw.bio,
        experience: raw.experience,
        education: raw.education,
        university: raw.university,
        eduLevel: raw.eduLevel ?? "",
        hourlyRate: rateRaw ?? "",
        hourlyRateMax: rateMaxRaw ?? "",
        mode: raw.mode ?? "BOTH",
      },
    };
  }

  const { gender, avatarUrl, ...profileData } = parsed.data;

  // 公開顯示名稱（欄位嵌在主表單裡，隨「儲存檔案」一併保存）
  let displayName: string | null | undefined;
  const nameMode = formData.get("nameMode")?.toString();
  if (nameMode === "real") {
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    displayName = me?.name;
  } else if (nameMode === "alias") {
    displayName = formData.get("displayName")?.toString().trim() || null;
    if (displayName && displayName.length > 30) {
      return { fieldErrors: { displayName: ["化名過長（最多 30 字）"] } };
    }
  }

  // 詳細欄位（成績/客製時薪/上課時間）：解析並正規化後存 Json
  const exams = parseExams(safeJson(formData.get("exams")));
  const rateRules = parseRateRules(safeJson(formData.get("rateRules"))).filter(
    (r) => profileData.subjects.includes(r.subject) // 只留仍為專長的科目
  );
  const availability = parseAvailability(safeJson(formData.get("availability")));

  // 性別與頭像存在 User，其餘存在 TutorProfile
  await db.user.update({
    where: { id: session.user.id },
    data: {
      gender,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
    },
  });
  await db.tutorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...profileData,
      exams,
      rateRules,
      availability: availability ?? undefined,
    },
  });

  // 老師檔案會出現在這些家長端頁面，一併刷新快取
  revalidatePath("/dashboard/profile");
  revalidatePath("/tutors");
  revalidatePath("/"); // 首頁精選老師
  revalidatePath(`/u/${session.user.id}`); // 公開檔案頁
  return { success: "檔案已儲存" };
}
