"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function approveVerification(id: string) {
  if (!(await requireAdmin())) return;

  const req = await db.verificationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return;

  await db.$transaction([
    db.verificationRequest.update({
      where: { id },
      // 審核完成即清除證件影像，不長期保存敏感個資
      data: { status: "APPROVED", reviewedAt: new Date(), docUrl: null },
    }),
    db.user.update({
      where: { id: req.userId },
      data:
        req.type === "IDENTITY"
          ? { idVerified: true }
          : req.type === "BACKGROUND"
            ? { bgCheckVerified: true }
            : { eduVerified: true },
    }),
  ]);

  revalidatePath("/admin/verifications");
}

export async function rejectVerification(id: string) {
  if (!(await requireAdmin())) return;

  await db.verificationRequest.update({
    where: { id },
    // 退回後同樣清除證件影像
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      note: "證件不清晰或不符",
      docUrl: null,
    },
  });

  revalidatePath("/admin/verifications");
}
