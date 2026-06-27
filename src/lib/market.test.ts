import assert from "node:assert";
import { rateRow, aggregateMarket } from "./market";

// rateRow：avg/min/max/count
const r = rateRow("數學", [300, 500, 400]);
assert.strictEqual(r.count, 3);
assert.strictEqual(r.avg, 400);
assert.strictEqual(r.min, 300);
assert.strictEqual(r.max, 500);

// 空集合
const e = rateRow("空", []);
assert.deepStrictEqual(e, { key: "空", count: 0, avg: 0, min: 0, max: 0 });

// aggregateMarket：依科目分組 + 供需
const tutors = [
  { hourlyRate: 300, subjects: ["數學"], levels: ["國中"], regions: ["台北市"] },
  { hourlyRate: 500, subjects: ["數學"], levels: ["高中"], regions: ["台北市"] },
  { hourlyRate: null, subjects: ["英文"], levels: ["國中"], regions: ["線上"] }, // 無時薪不計
];
const jobs = [{ budget: 600 }, { budget: 400 }, { budget: null }];
const m = aggregateMarket(tutors, jobs, {
  subjects: ["數學", "英文"],
  levels: ["國中", "高中"],
  regions: ["台北市", "線上"],
});
const math = m.bySubject.find((x) => x.key === "數學");
assert.strictEqual(math?.avg, 400);
assert.strictEqual(math?.count, 2);
// 英文僅有 null 時薪 → 不應出現
assert.strictEqual(m.bySubject.find((x) => x.key === "英文"), undefined);
assert.strictEqual(m.supplyAvg, 400); // (300+500)/2
assert.strictEqual(m.demandAvg, 500); // (600+400)/2

console.log("market.test.ts OK");
