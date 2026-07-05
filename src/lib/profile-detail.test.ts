// 檔案詳細欄位自檢：npx tsx src/lib/profile-detail.test.ts
import assert from "node:assert";
import {
  parseExams,
  parseRateRules,
  parseAvailability,
  rateRuleLabel,
  slotLabel,
} from "./profile-detail";

// parse 對垃圾輸入要安全（來自 DB Json，可能任意）
assert.deepEqual(parseExams(null), []);
assert.deepEqual(parseExams("x"), []);
assert.deepEqual(parseExams([{ type: "會考", score: "5A" }, { bad: 1 }]), [
  { type: "會考", score: "5A" },
]);

// rateRules 過濾缺欄位，數字正規化
assert.deepEqual(
  parseRateRules([{ subject: "數學", rate: "800" }, { rate: 500 }]),
  [{ subject: "數學", level: undefined, rate: 800, rateMax: undefined }]
);

assert.equal(
  rateRuleLabel({ subject: "數學", level: "高中", rate: 800, rateMax: 1000 }),
  "數學・高中：NT$800–1000 / 小時"
);
assert.equal(
  rateRuleLabel({ subject: "英文", rate: 600 }),
  "英文：NT$600 / 小時"
);

// availability：discuss、slots、以及丟棄沒選日的 slot
assert.deepEqual(parseAvailability({ mode: "discuss" }), { mode: "discuss" });
assert.deepEqual(parseAvailability(null), null);
const av = parseAvailability({
  mode: "slots",
  slots: [
    { days: ["一", "三"], start: 18, end: 21, hours: 2 },
    { days: [], start: 9, end: 10 },
  ],
});
assert.equal(av?.mode, "slots");
assert.equal(av?.mode === "slots" && av.slots.length, 1);

assert.equal(
  slotLabel({ days: ["一", "三", "五"], start: 18, end: 21, hours: 2 }),
  "週一、週三、週五 18:00–21:00，每次 2 小時"
);

console.log("profile-detail.test.ts OK");
