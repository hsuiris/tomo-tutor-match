// 上架完整度檢查：家長不該在「找老師」列表看到空白檔案。
// 規則：至少 1 個專長科目 + 有填時薪，才能開放接案。
export type PublishableProfile = {
  subjects: string[];
  hourlyRate: number | null;
};

// 回傳「還缺哪些必填欄位」；空陣列代表可以上架。
export function missingPublishFields(
  profile: PublishableProfile | null
): string[] {
  const missing: string[] = [];
  if (!profile || profile.subjects.length === 0) missing.push("專長科目");
  if (!profile || profile.hourlyRate == null) missing.push("時薪");
  return missing;
}

// 面板上的「檔案完成度」引導：required 項與 missingPublishFields 一致（上架必填），
// 其餘為提升成交/信任的加分項。
export type ChecklistProfile = PublishableProfile & {
  bio: string | null;
  experience: string | null;
  education: string | null;
  university: string | null;
  idVerified: boolean;
};

export type ChecklistItem = { label: string; done: boolean; required: boolean };

export function profileChecklist(p: ChecklistProfile): ChecklistItem[] {
  const has = (s: string | null) => !!s?.trim();
  return [
    { label: "專長科目", done: p.subjects.length > 0, required: true },
    { label: "時薪", done: p.hourlyRate != null, required: true },
    { label: "自我介紹", done: has(p.bio), required: false },
    {
      label: "教學經歷或學歷",
      done: has(p.experience) || has(p.education) || has(p.university),
      required: false,
    },
    { label: "實名認證", done: p.idVerified, required: false },
  ];
}
