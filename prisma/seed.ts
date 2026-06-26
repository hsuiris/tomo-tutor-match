import bcrypt from "bcryptjs";
import {
  PrismaClient,
  type TeachingMode,
  type Gender,
} from "../src/generated/prisma";

const db = new PrismaClient();

type TutorSeed = {
  name: string;
  email: string;
  bio: string;
  subjects: string[];
  levels: string[];
  regions: string[];
  hourlyRate: number;
  experience: string;
  education: string;
  mode: TeachingMode;
  gender: Gender;
};

const tutors: TutorSeed[] = [
  {
    name: "王思涵",
    email: "wang@demo.com",
    gender: "FEMALE",
    bio: "台大數學系畢業，專攻國高中數學，擅長用生活例子讓抽象概念變簡單。",
    subjects: ["數學", "物理"],
    levels: ["國中", "高中"],
    regions: ["台北市", "新北市", "線上"],
    hourlyRate: 800,
    experience: "5 年家教經驗，帶過 30+ 位學生",
    education: "國立台灣大學 數學系",
    mode: "BOTH",
  },
  {
    name: "陳冠宇",
    email: "chen@demo.com",
    gender: "MALE",
    bio: "全英文教學，多益 980 分，曾在美國交換一年，注重口說與聽力。",
    subjects: ["英文"],
    levels: ["國中", "高中", "成人"],
    regions: ["線上"],
    hourlyRate: 600,
    experience: "3 年線上英文教學",
    education: "國立政治大學 英國語文學系",
    mode: "ONLINE",
  },
  {
    name: "林雅婷",
    email: "lin@demo.com",
    gender: "FEMALE",
    bio: "資工背景，教 Python 與網頁開發，從零基礎帶到能做出專案。",
    subjects: ["程式設計", "數學"],
    levels: ["高中", "大學", "成人"],
    regions: ["線上", "新竹市"],
    hourlyRate: 1000,
    experience: "資深軟體工程師，業餘教學 4 年",
    education: "國立清華大學 資訊工程學系",
    mode: "BOTH",
  },
  {
    name: "張庭瑋",
    email: "chang@demo.com",
    gender: "MALE",
    bio: "高中化學、生物專長，醫學院學生，熟悉學測與分科測驗。",
    subjects: ["化學", "生物"],
    levels: ["高中"],
    regions: ["台中市", "線上"],
    hourlyRate: 700,
    experience: "2 年家教，學測自然滿級分",
    education: "中國醫藥大學 醫學系",
    mode: "BOTH",
  },
  {
    name: "黃詩涵",
    email: "huang@demo.com",
    gender: "FEMALE",
    bio: "日語檢定 N1，曾留學東京，輕鬆教會你日常會話與文法。",
    subjects: ["日文"],
    levels: ["高中", "大學", "成人"],
    regions: ["高雄市", "線上"],
    hourlyRate: 550,
    experience: "4 年日文教學",
    education: "高雄第一科技大學 應用日語系",
    mode: "BOTH",
  },
  {
    name: "李俊賢",
    email: "lee@demo.com",
    gender: "MALE",
    bio: "國文與歷史專長，會考國文滿分，擅長作文與文言文。",
    subjects: ["國文", "歷史"],
    levels: ["國中", "高中"],
    regions: ["台北市"],
    hourlyRate: 650,
    experience: "6 年國高中國文家教",
    education: "國立師範大學 國文學系",
    mode: "IN_PERSON",
  },
  {
    name: "吳承恩",
    email: "wu@demo.com",
    gender: "MALE",
    bio: "會計與經濟雙專長，會計師考試通過，教學重觀念不死背。",
    subjects: ["會計", "經濟"],
    levels: ["大學", "成人"],
    regions: ["線上", "台北市"],
    hourlyRate: 900,
    experience: "執業會計師，兼職教學 3 年",
    education: "國立政治大學 會計學系",
    mode: "BOTH",
  },
  {
    name: "鄭欣怡",
    email: "cheng@demo.com",
    gender: "FEMALE",
    bio: "音樂系主修鋼琴，教學耐心，適合兒童與成人初學者。",
    subjects: ["鋼琴", "美術"],
    levels: ["國小", "國中", "成人"],
    regions: ["桃園市"],
    hourlyRate: 750,
    experience: "8 年鋼琴教學",
    education: "國立台北藝術大學 音樂學系",
    mode: "IN_PERSON",
  },
];

// 給部分老師的評價（rating, comment）
const reviewsByEmail: Record<string, { rating: number; comment: string }[]> = {
  "wang@demo.com": [
    { rating: 5, comment: "老師教得超清楚，數學進步很多！" },
    { rating: 5, comment: "很有耐心，會針對弱點加強。" },
    { rating: 4, comment: "講解仔細，作業有點多但有效。" },
  ],
  "chen@demo.com": [
    { rating: 5, comment: "口說進步神速，上課很有趣。" },
    { rating: 4, comment: "發音糾正很到位。" },
  ],
  "lin@demo.com": [
    { rating: 5, comment: "從不會寫程式到能做出網站，超強！" },
    { rating: 5, comment: "教學很有系統，推薦給想學程式的人。" },
  ],
  "chang@demo.com": [{ rating: 4, comment: "化學觀念講得很清楚。" }],
  "lee@demo.com": [
    { rating: 5, comment: "作文進步很多，會考拿高分。" },
    { rating: 5, comment: "文言文不再害怕了。" },
  ],
};

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  // 兩位學生（用來當評價作者）
  const student = await db.user.upsert({
    where: { email: "student@demo.com" },
    update: { gender: "FEMALE" },
    create: {
      name: "示範學生",
      email: "student@demo.com",
      passwordHash,
      role: "STUDENT",
      gender: "FEMALE",
    },
  });

  // 管理員（審核認證用）
  await db.user.upsert({
    where: { email: "admin@demo.com" },
    update: { role: "ADMIN" },
    create: {
      name: "平台管理員",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
      gender: "UNDISCLOSED",
    },
  });

  // 額外幾位評價者（每位對同一老師只能評一次,需不同作者）
  const reviewerSeeds = [
    { name: "林媽媽", email: "parent1@demo.com", displayName: "林媽媽" },
    { name: "陳同學", email: "parent2@demo.com", displayName: "陳同學" },
  ];
  const reviewers = [student];
  for (const rs of reviewerSeeds) {
    const u = await db.user.upsert({
      where: { email: rs.email },
      update: { displayName: rs.displayName },
      create: {
        name: rs.name,
        email: rs.email,
        passwordHash,
        role: "STUDENT",
        displayName: rs.displayName,
      },
    });
    reviewers.push(u);
  }

  // 這幾位 demo 老師已通過無犯罪紀錄查驗（其餘僅實名認證）
  const bgVerifiedEmails = [
    "wang@demo.com",
    "lin@demo.com",
    "lee@demo.com",
    "wu@demo.com",
  ];

  for (const t of tutors) {
    const verification = {
      displayName: `${t.name.slice(0, 1)}老師`, // 公開化名
      idVerified: true,
      bgCheckVerified: bgVerifiedEmails.includes(t.email),
    };
    const user = await db.user.upsert({
      where: { email: t.email },
      update: { gender: t.gender, ...verification },
      create: {
        name: t.name,
        email: t.email,
        passwordHash,
        role: "TUTOR",
        gender: t.gender,
        ...verification,
      },
    });

    const profile = await db.tutorProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: t.bio,
        subjects: t.subjects,
        levels: t.levels,
        regions: t.regions,
        hourlyRate: t.hourlyRate,
        experience: t.experience,
        education: t.education,
        mode: t.mode,
        isPublished: true,
      },
      create: {
        userId: user.id,
        bio: t.bio,
        subjects: t.subjects,
        levels: t.levels,
        regions: t.regions,
        hourlyRate: t.hourlyRate,
        experience: t.experience,
        education: t.education,
        mode: t.mode,
        isPublished: true,
      },
    });

    // 評價（留在老師 User 底下;先清掉舊的再重建）
    await db.review.deleteMany({ where: { revieweeId: user.id } });
    const reviews = reviewsByEmail[t.email] ?? [];
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      await db.review.create({
        data: {
          revieweeId: user.id,
          authorId: reviewers[i % reviewers.length].id,
          rating: r.rating,
          comment: r.comment,
        },
      });
    }

    // 更新評分統計
    const count = reviews.length;
    const avg = count
      ? reviews.reduce((s, r) => s + r.rating, 0) / count
      : 0;
    await db.tutorProfile.update({
      where: { id: profile.id },
      data: { ratingAvg: avg, ratingCount: count },
    });
  }

  // 討論區範例
  await db.forumReply.deleteMany({});
  await db.forumPost.deleteMany({});
  const wang = await db.user.findUnique({ where: { email: "wang@demo.com" } });
  const lin = await db.user.findUnique({ where: { email: "lin@demo.com" } });
  if (wang && lin) {
    const p1 = await db.forumPost.create({
      data: {
        board: "TUTOR",
        authorId: wang.id,
        title: "大家都怎麼跟家長談時薪？",
        body: "想請教各位老師,第一次接案時時薪怎麼開比較合理?會依學生年級調整嗎?",
      },
    });
    await db.forumReply.create({
      data: {
        postId: p1.id,
        authorId: lin.id,
        anonymous: true,
        body: "我會依學制分級,高中以上加價,試教第一堂可以稍微優惠。",
      },
    });
    await db.forumPost.create({
      data: {
        board: "TUTOR",
        authorId: lin.id,
        title: "分享：線上教學好用的白板工具",
        body: "最近改用 Excalidraw + iPad,學生反應很好,推薦給大家。",
      },
    });

    const p3 = await db.forumPost.create({
      data: {
        board: "PARENT",
        authorId: student.id,
        title: "小孩國三數學跟不上,該找一對一還是補習班?",
        body: "孩子基礎比較弱,想問有經驗的家長都怎麼選?",
        anonymous: true,
      },
    });
    await db.forumReply.create({
      data: {
        postId: p3.id,
        authorId: wang.id,
        body: "基礎弱的話一對一比較能客製化,先抓觀念漏洞會進步比較快。",
      },
    });
  }

  console.log(`✅ Seed 完成：${tutors.length} 位老師 + 學生、評價者、討論區範例`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
