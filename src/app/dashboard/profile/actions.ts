"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/types";

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR") {
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
    isPublished: formData.get("isPublished") === "on",
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

  // 性別與頭像存在 User，其餘存在 TutorProfile
  await db.user.update({
    where: { id: session.user.id },
    data: {
      gender,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });
  await db.tutorProfile.update({
    where: { userId: session.user.id },
    data: profileData,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/tutors`);
  return { success: "檔案已儲存" };
}
