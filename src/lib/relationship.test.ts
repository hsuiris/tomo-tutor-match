// 關係方向自檢：npx tsx src/lib/relationship.test.ts
import assert from "node:assert";
import { classifyRelations, relationLabel } from "./relationship";

// 對方教我 → 對方是我的老師
{
  const { myTutorIds, myStudentIds } = classifyRelations(
    [{ tutor: { userId: "T" }, job: { studentId: "ME" } }],
    "ME"
  );
  assert.ok(myTutorIds.has("T"));
  assert.equal(myStudentIds.size, 0);
}

// 我教對方 → 對方是我的學生
{
  const { myTutorIds, myStudentIds } = classifyRelations(
    [{ tutor: { userId: "ME" }, job: { studentId: "S" } }],
    "ME"
  );
  assert.ok(myStudentIds.has("S"));
  assert.equal(myTutorIds.size, 0);
}

// 反轉關係：對方同時教過我、也被我教過 → 兩種身分都成立
{
  const { myTutorIds, myStudentIds } = classifyRelations(
    [
      { tutor: { userId: "X" }, job: { studentId: "ME" } },
      { tutor: { userId: "ME" }, job: { studentId: "X" } },
    ],
    "ME"
  );
  assert.ok(myTutorIds.has("X"));
  assert.ok(myStudentIds.has("X"));
  assert.equal(relationLabel(true, true), "你的老師・你的學生");
}

// 標籤
assert.equal(relationLabel(true, false), "你的老師");
assert.equal(relationLabel(false, true), "你的學生");
assert.equal(relationLabel(false, false), null);

console.log("relationship.test.ts ✓");
