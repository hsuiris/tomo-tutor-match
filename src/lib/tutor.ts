import { db } from "@/lib/db";

// 「能不能當老師」的依據是「有沒有老師檔案」，不是 JWT 裡的 role
// （role 在登入時寫死，升級成老師後不會即時更新；查 DB 才永遠是新的）
export const hasTutorProfile = (userId: string) =>
  db.tutorProfile
    .findUnique({ where: { userId }, select: { id: true } })
    .then(Boolean);
