// 上架完整度自檢：npx tsx src/lib/tutor-publish.test.ts
import assert from "node:assert";
import { missingPublishFields, profileChecklist } from "./tutor-publish";

// 完整 → 可上架（空陣列）
assert.deepEqual(missingPublishFields({ subjects: ["數學"], hourlyRate: 600 }), []);
// 缺科目
assert.deepEqual(missingPublishFields({ subjects: [], hourlyRate: 600 }), ["專長科目"]);
// 缺時薪（0 是有效時薪嗎？此處只擋未填 null；0 由表單驗證處理）
assert.deepEqual(missingPublishFields({ subjects: ["英文"], hourlyRate: null }), ["時薪"]);
// 兩者都缺 / 全空白檔案
assert.deepEqual(missingPublishFields({ subjects: [], hourlyRate: null }), ["專長科目", "時薪"]);
assert.deepEqual(missingPublishFields(null), ["專長科目", "時薪"]);

// 完成度清單：required 項對齊 missingPublishFields；加分項各自判斷
const emptyProfile = {
  subjects: [] as string[],
  hourlyRate: null,
  bio: null,
  experience: null,
  education: null,
  university: null,
  idVerified: false,
};
assert.deepEqual(
  profileChecklist(emptyProfile).map((i) => i.done),
  [false, false, false, false, false]
);
// bio 只有空白 → 不算完成；經歷有值 → 該項完成
assert.deepEqual(
  profileChecklist({
    subjects: ["數學"],
    hourlyRate: 600,
    bio: "   ",
    experience: "家教 3 年",
    education: null,
    university: null,
    idVerified: true,
  }).map((i) => i.done),
  [true, true, false, true, true]
);
// required 旗標只在前兩項
assert.deepEqual(
  profileChecklist(emptyProfile).map((i) => i.required),
  [true, true, false, false, false]
);

console.log("tutor-publish.test.ts ✓");
