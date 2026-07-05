import { db } from "@/lib/db";

// 已媒合（ACCEPTED）的 application 在「我」視角下的方向
type Row = { tutor: { userId: string }; job: { studentId: string } };

// 純函式：把已媒合關係分成「教過我的人」與「我教過的人」（可同時成立＝反轉關係）
export function classifyRelations(rows: Row[], me: string) {
  const myTutorIds = new Set<string>(); // 對方教我 → 對方是我的老師
  const myStudentIds = new Set<string>(); // 我教對方 → 對方是我的學生
  for (const r of rows) {
    if (r.job.studentId === me) myTutorIds.add(r.tutor.userId);
    if (r.tutor.userId === me) myStudentIds.add(r.job.studentId);
  }
  return { myTutorIds, myStudentIds };
}

// 一次查出「我」所有已媒合關係，給收件匣／聊天室標註對方身分用
export async function teachingRelations(me: string) {
  const rows = await db.application.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ tutor: { userId: me } }, { job: { studentId: me } }],
    },
    select: {
      tutor: { select: { userId: true } },
      job: { select: { studentId: true } },
    },
  });
  return classifyRelations(rows, me);
}

// 對方相對於「我」的身分標籤；反轉關係兩個都標，沒媒合過則不標
export function relationLabel(
  isMyTutor: boolean,
  isMyStudent: boolean
): string | null {
  if (isMyTutor && isMyStudent) return "老師・學生";
  if (isMyTutor) return "老師";
  if (isMyStudent) return "學生";
  return null;
}
