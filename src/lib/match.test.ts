// 配對引擎自檢：npx tsx src/lib/match.test.ts
import assert from "node:assert";
import {
  scoreTutor,
  rankTutors,
  scoreJob,
  type MatchTutor,
  type MatchJob,
  type MatchCriteria,
  type JobMatchProfile,
} from "./match";

function tutor(over: Partial<MatchTutor> = {}): MatchTutor {
  return {
    id: "t",
    bio: null,
    subjects: ["數學"],
    levels: ["高中"],
    regions: ["台北市"],
    hourlyRate: 500,
    hourlyRateMax: null,
    mode: "IN_PERSON",
    university: null,
    eduLevel: null,
    experience: null,
    ratingAvg: 0,
    ratingCount: 0,
    user: {
      id: "u",
      name: "T",
      displayName: null,
      avatarUrl: null,
      gender: "UNDISCLOSED",
      idVerified: false,
      bgCheckVerified: false,
      eduVerified: false,
    },
    ...over,
  };
}

const crit: MatchCriteria = {
  subject: "數學",
  level: "高中",
  region: "台北市",
  budget: 600,
};

// 科目硬門檻：不教該科 → 即使其他條件完美也被重罰
const good = tutor({ subjects: ["數學"], ratingAvg: 5, ratingCount: 10 });
const wrong = tutor({ subjects: ["英文"], ratingAvg: 5, ratingCount: 10 });
const sGood = scoreTutor(good, crit).score;
const sWrong = scoreTutor(wrong, crit).score;
assert.ok(sGood >= 80, `教該科目應高分，得 ${sGood}`);
assert.ok(sWrong <= 20, `不教該科目應被壓低，得 ${sWrong}`);
assert.ok(sGood > sWrong * 3, "科目符合者應遠勝不符者");

// 預算區間：老師區間整段在預算內 → 標示「在預算內」
const ranged = tutor({ hourlyRate: 400, hourlyRateMax: 550 });
const inBudget = scoreTutor(ranged, { subject: "數學", budget: 600 });
assert.ok(
  inBudget.reasons.some((r) => r.positive && r.label.includes("在預算內")),
  "區間在預算內應標示在預算內"
);

// 預算區間：下限就遠超預算 → 分數低於可負擔者
const pricey = tutor({ hourlyRate: 1000, hourlyRateMax: 1200 });
const over = scoreTutor(pricey, { subject: "數學", budget: 500 }).score;
const afford = scoreTutor(ranged, { subject: "數學", budget: 500 }).score;
assert.ok(over < afford, `超預算 ${over} 應低於可負擔 ${afford}`);

// rankTutors 由高到低，科目符合者排前
const ranked = rankTutors([wrong, good], crit);
assert.strictEqual(ranked[0].tutor.subjects[0], "數學", "符合科目者排第一");

// ── 反向：老師找案件 ──
const profile: JobMatchProfile = {
  subjects: ["數學"],
  levels: ["高中"],
  regions: ["台北市"],
  hourlyRate: 600,
  mode: "BOTH",
};

function job(over: Partial<MatchJob> = {}): MatchJob {
  return {
    id: "j",
    title: "x",
    subject: "數學",
    level: "高中",
    regions: ["台北市"],
    mode: "BOTH",
    budget: 500,
    budgetMax: 700,
    status: "OPEN",
    studentStatus: null,
    parentNeeds: null,
    createdAt: new Date("2020-01-01"),
    student: { name: "S" },
    _count: { applications: 0 },
    ...over,
  };
}

// 預算區間上限可達老師時薪 → 標示「可達你的時薪」
const reach = scoreJob(job(), profile);
assert.ok(
  reach.reasons.some((r) => r.positive && r.label.includes("可達你的時薪")),
  "預算上限達時薪應標示"
);

// 案件科目硬門檻
const wrongJob = scoreJob(job({ subject: "英文" }), profile).score;
const rightJob = scoreJob(job({ subject: "數學" }), profile).score;
assert.ok(rightJob > wrongJob * 3, "符合專長的案件應遠勝不符的");

console.log("match.test.ts OK");
