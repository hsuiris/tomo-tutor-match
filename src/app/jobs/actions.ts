"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobSchema, applicationSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/types";

// 學生發布需求
export async function createJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const budgetRaw = formData.get("budget")?.toString().trim();
  const budgetMaxRaw = formData.get("budgetMax")?.toString().trim();
  const raw = {
    title: formData.get("title")?.toString().trim() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    level: formData.get("level")?.toString() ?? "",
    region: formData.get("region")?.toString() ?? "",
    mode: formData.get("mode")?.toString(),
    budget: budgetRaw ? Number(budgetRaw) : undefined,
    budgetMax: budgetMaxRaw ? Number(budgetMaxRaw) : undefined,
    description: formData.get("description")?.toString().trim() ?? "",
    studentStatus: formData.get("studentStatus")?.toString().trim() ?? "",
    parentNeeds: formData.get("parentNeeds")?.toString().trim() ?? "",
  };

  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        title: raw.title,
        subject: raw.subject,
        level: raw.level,
        region: raw.region,
        mode: raw.mode ?? "BOTH",
        budget: budgetRaw ?? "",
        budgetMax: budgetMaxRaw ?? "",
        description: raw.description,
        studentStatus: raw.studentStatus,
        parentNeeds: raw.parentNeeds,
      },
    };
  }

  const job = await db.jobPost.create({
    data: {
      ...parsed.data,
      description: parsed.data.description ?? "",
      studentId: session.user.id,
    },
  });

  revalidatePath("/jobs");
  return { redirectTo: `/jobs/${job.id}` };
}

// 老師應徵案件
export async function applyToJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (session.user.role !== "TUTOR") {
    return { error: "只有家教老師可以應徵" };
  }

  const raw = {
    jobId: formData.get("jobId")?.toString() ?? "",
    message: formData.get("message")?.toString().trim() ?? "",
  };
  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { message: raw.message },
    };
  }

  const profile = await db.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { error: "找不到你的老師檔案" };

  const job = await db.jobPost.findUnique({
    where: { id: parsed.data.jobId },
    select: { status: true },
  });
  if (!job || job.status !== "OPEN") {
    return { error: "這個案件已經不開放應徵了" };
  }

  // 重複應徵會違反 unique 限制
  const existing = await db.application.findUnique({
    where: {
      jobId_tutorId: { jobId: parsed.data.jobId, tutorId: profile.id },
    },
  });
  if (existing) return { error: "你已經應徵過這個案件了" };

  await db.application.create({
    data: {
      jobId: parsed.data.jobId,
      tutorId: profile.id,
      message: parsed.data.message,
    },
  });

  revalidatePath(`/jobs/${parsed.data.jobId}`);
  return { success: "應徵已送出" };
}

// 學生接受某位老師（完成配對）
export async function acceptApplication(applicationId: string) {
  const session = await auth();
  if (!session) return;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { id: true, studentId: true } } },
  });
  if (!app || app.job.studentId !== session.user.id) return;

  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    }),
    // 其他應徵者標記為未錄取
    db.application.updateMany({
      where: { jobId: app.job.id, id: { not: applicationId } },
      data: { status: "REJECTED" },
    }),
    db.jobPost.update({
      where: { id: app.job.id },
      data: { status: "MATCHED" },
    }),
  ]);

  revalidatePath(`/jobs/${app.job.id}`);
}

// 學生拒絕某位應徵者
export async function rejectApplication(applicationId: string) {
  const session = await auth();
  if (!session) return;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { id: true, studentId: true } } },
  });
  if (!app || app.job.studentId !== session.user.id) return;

  await db.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED" },
  });

  revalidatePath(`/jobs/${app.job.id}`);
}
