"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobSchema, applicationSchema } from "@/lib/validations";
import { notify } from "@/lib/email";
import { notifySystem } from "@/lib/notification";
import { rateLimit } from "@/lib/rate-limit";
import { isEmailVerified } from "@/lib/verify-email";
import type { ActionState } from "@/lib/types";

// 學生發布需求
export async function createJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (!(await isEmailVerified(session.user.id))) {
    return { error: "請先完成 Email 驗證（到信箱點擊驗證連結）" };
  }

  const budgetRaw = formData.get("budget")?.toString().trim();
  const budgetMaxRaw = formData.get("budgetMax")?.toString().trim();
  const raw = {
    title: formData.get("title")?.toString().trim() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    level: formData.get("level")?.toString() ?? "",
    regions: formData.getAll("regions").map(String),
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

// 案主編輯自己發布的需求（僅限徵求中）
export async function updateJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const jobId = formData.get("jobId")?.toString() ?? "";
  const existing = await db.jobPost.findUnique({
    where: { id: jobId },
    select: { studentId: true, status: true },
  });
  if (!existing || existing.studentId !== session.user.id) {
    return { error: "沒有權限" };
  }
  if (existing.status !== "OPEN") {
    return { error: "已配對或關閉的案件無法編輯" };
  }

  const budgetRaw = formData.get("budget")?.toString().trim();
  const budgetMaxRaw = formData.get("budgetMax")?.toString().trim();
  const raw = {
    title: formData.get("title")?.toString().trim() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    level: formData.get("level")?.toString() ?? "",
    regions: formData.getAll("regions").map(String),
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
        mode: raw.mode ?? "BOTH",
        budget: budgetRaw ?? "",
        budgetMax: budgetMaxRaw ?? "",
        description: raw.description,
        studentStatus: raw.studentStatus,
        parentNeeds: raw.parentNeeds,
      },
    };
  }

  await db.jobPost.update({
    where: { id: jobId },
    data: { ...parsed.data, description: parsed.data.description ?? "" },
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  return { redirectTo: `/jobs/${jobId}` };
}

// 案主刪除自己發布的需求（應徵、收藏由 schema cascade 一併刪除）
export async function deleteOwnJob(
  jobId: string
): Promise<{ redirectTo?: string; error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const job = await db.jobPost.findUnique({
    where: { id: jobId },
    select: {
      studentId: true,
      title: true,
      applications: {
        where: { status: "PENDING" },
        select: { tutor: { select: { userId: true } } },
      },
    },
  });
  if (!job || job.studentId !== session.user.id) return { error: "沒有權限" };

  // 先通知還在等待的應徵老師，再刪除
  for (const app of job.applications) {
    await notifySystem(
      app.tutor.userId,
      `案件「${job.title}」已由案主移除`,
      "這個需求已下架，你的應徵一併結束。看看其他開放中的案件吧。",
      "/jobs"
    );
  }

  await db.jobPost.delete({ where: { id: jobId } });

  revalidatePath("/jobs");
  revalidatePath("/favorites");
  revalidatePath("/dashboard/jobs");
  return { redirectTo: "/dashboard/jobs" };
}

// 老師應徵案件
export async function applyToJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (!(await isEmailVerified(session.user.id))) {
    return { error: "請先完成 Email 驗證（到信箱點擊驗證連結）" };
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
  if (!profile) return { error: "請先在面板上「成為老師」，才能應徵案件" };

  const job = await db.jobPost.findUnique({
    where: { id: parsed.data.jobId },
    select: { status: true, studentId: true, title: true },
  });
  if (!job || job.status !== "OPEN") {
    return { error: "這個案件已經不開放應徵了" };
  }
  // 不能應徵自己發布的需求（兼任學生＋老師時的自我配對）
  if (job.studentId === session.user.id) {
    return { error: "不能應徵自己發布的需求" };
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

  // 應徵的案件自動存入收藏（收藏頁的「已應徵」區）
  await db.favorite.upsert({
    where: {
      userId_jobId: { userId: session.user.id, jobId: parsed.data.jobId },
    },
    update: {},
    create: { userId: session.user.id, jobId: parsed.data.jobId },
  });

  // 通知案主有新應徵：站內通知（訊息頁）+ Email（依其通知偏好）
  await notifySystem(
    job.studentId,
    `你的案件「${job.title}」收到新應徵`,
    "有老師應徵了你的家教需求，點擊查看應徵訊息並回覆。",
    `/jobs/${parsed.data.jobId}`
  );
  await notify({
    userId: job.studentId,
    kind: "jobUpdate",
    subject: `Tomo：你的案件「${job.title}」收到新應徵`,
    html: `<p>有老師應徵你的家教案件「${job.title}」，登入即可查看並選擇老師。</p>`,
  });

  revalidatePath(`/jobs/${parsed.data.jobId}`);
  revalidatePath("/favorites");
  revalidatePath("/messages");
  return { success: "應徵已送出，並自動存入收藏的「已應徵」" };
}

// 老師取消應徵（僅限尚未被接受/婉拒時）
export async function cancelApplication(applicationId: string) {
  const session = await auth();
  if (!session) return;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      tutor: { select: { userId: true } },
      job: { select: { id: true } },
    },
  });
  if (!app || app.tutor.userId !== session.user.id) return;
  if (app.status !== "PENDING") return;

  await db.application.delete({ where: { id: applicationId } });

  revalidatePath(`/jobs/${app.job.id}`);
  revalidatePath("/favorites");
}

// 老師編輯應徵訊息（僅限尚未被接受/婉拒時）
export async function updateApplication(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const applicationId = formData.get("applicationId")?.toString() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";
  if (message.length < 5) {
    return { fieldErrors: { message: ["請寫下你的應徵訊息,至少 5 個字"] } };
  }
  if (message.length > 1000) {
    return { fieldErrors: { message: ["訊息過長"] } };
  }

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      tutor: { select: { userId: true } },
      job: { select: { id: true } },
    },
  });
  if (!app || app.tutor.userId !== session.user.id) return { error: "沒有權限" };
  if (app.status !== "PENDING") return { error: "此應徵已有結果，無法編輯" };

  await db.application.update({
    where: { id: applicationId },
    data: { message },
  });

  revalidatePath(`/jobs/${app.job.id}`);
  return { success: "應徵訊息已更新" };
}

// 應徵下的討論回覆（案主與該應徵老師皆可）
export async function replyToApplication(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (!(await isEmailVerified(session.user.id))) {
    return { error: "請先完成 Email 驗證（到信箱點擊驗證連結）" };
  }

  const applicationId = formData.get("applicationId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (!body) return { fieldErrors: { body: ["請輸入回覆內容"] } };
  if (body.length > 1000) return { fieldErrors: { body: ["回覆過長"] } };

  // 防洗版：每人每小時最多 20 則
  if (!(await rateLimit(`appreply:${session.user.id}`, 20, 3600))) {
    return { error: "操作太頻繁，請稍後再試" };
  }

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      tutor: { select: { userId: true } },
      job: { select: { id: true, studentId: true, title: true } },
    },
  });
  if (!app) return { error: "找不到應徵" };

  const me = session.user.id;
  const isOwner = app.job.studentId === me;
  const isApplicant = app.tutor.userId === me;
  if (!isOwner && !isApplicant) return { error: "沒有權限" };

  await db.applicationReply.create({
    data: { applicationId, authorId: me, body },
  });

  // 站內通知另一方
  const otherId = isOwner ? app.tutor.userId : app.job.studentId;
  await notifySystem(
    otherId,
    `案件「${app.job.title}」的應徵討論有新回覆`,
    body.length > 50 ? `${body.slice(0, 50)}…` : body,
    `/jobs/${app.job.id}`
  );

  revalidatePath(`/jobs/${app.job.id}`);
  return { success: "已回覆" };
}

// 學生接受某位老師（完成配對）
export async function acceptApplication(applicationId: string) {
  const session = await auth();
  if (!session) return;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, studentId: true, title: true } },
      tutor: { select: { userId: true } },
    },
  });
  if (!app || app.job.studentId !== session.user.id) return;

  // 其他落選者名單（通知用，需在標記 REJECTED 前取得）
  const others = await db.application.findMany({
    where: { jobId: app.job.id, id: { not: applicationId }, status: "PENDING" },
    select: { tutor: { select: { userId: true } } },
  });

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

  // 通知被錄取的老師：站內通知 + Email（依其通知偏好）
  await notifySystem(
    app.tutor.userId,
    `你被選上了！案件「${app.job.title}」`,
    "恭喜！家長選擇了你，點擊查看案件並私訊聯繫。",
    `/jobs/${app.job.id}`
  );
  await notify({
    userId: app.tutor.userId,
    kind: "jobUpdate",
    subject: `Tomo：你被選上了！案件「${app.job.title}」`,
    html: `<p>恭喜！家長選擇了你來教授「${app.job.title}」，登入即可私訊聯繫。</p>`,
  });

  // 站內通知其他落選者，別讓人一直等
  for (const o of others) {
    await notifySystem(
      o.tutor.userId,
      `案件「${app.job.title}」已選定其他老師`,
      "這次未被選上，別氣餒，還有更多案件等你應徵。",
      "/jobs"
    );
  }

  revalidatePath(`/jobs/${app.job.id}`);
}

// 學生拒絕某位應徵者
export async function rejectApplication(applicationId: string) {
  const session = await auth();
  if (!session) return;

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, studentId: true, title: true } },
      tutor: { select: { userId: true } },
    },
  });
  if (!app || app.job.studentId !== session.user.id) return;

  await db.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED" },
  });

  // 站內通知被婉拒的老師
  await notifySystem(
    app.tutor.userId,
    `案件「${app.job.title}」的應徵未被接受`,
    "這次未被選上，別氣餒，還有更多案件等你應徵。",
    "/jobs"
  );

  revalidatePath(`/jobs/${app.job.id}`);
}
