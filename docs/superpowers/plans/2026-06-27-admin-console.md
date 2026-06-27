# Admin 控制台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/admin` 從單一「認證審核」頁擴充成完整後台：使用者管理、媒合管理、數據儀表板、內容管理、家教行情分析，共用一個 admin 殼，權限為讀取 + 輕量審核。

**Architecture:** 沿用既有 [/admin/verifications](../../../src/app/admin/verifications/page.tsx) 的 server component + server action 寫法。新增一個 `admin/layout.tsx` 統一把關 `ADMIN` 權限，底下五頁各自查 `db` 渲染，少量審核動作寫進擴充後的 `admin/actions.ts`。零新依賴。

**Tech Stack:** Next 16.2.6（App Router、server components、server actions、`searchParams`/`params` 為 Promise）、Prisma（client 產生於 `src/generated/prisma`）、next-auth（JWT session）、Tailwind。

**測試取向（刻意偏離預設 TDD）：** 專案目前零測試框架。多數 admin 程式為 Prisma 讀取與一行 `updateMany`/`deleteMany`，屬 trivial plumbing，以 `npx tsc --noEmit` 型別檢查 + 手動跑 dev 驗證即可。唯一抽出的純邏輯（行情彙總 `src/lib/market.ts`）附一個 `npx tsx` 可跑的 `node:assert` 自檢（Task 9）。不為此引入 jest/vitest。

---

## File Structure

新增：
- `src/app/admin/layout.tsx` — 整區 ADMIN 權限閘 + 版面
- `src/components/AdminNav.tsx` — 側欄導覽（client，highlight 當前頁）
- `src/app/admin/page.tsx` — 數據儀表板
- `src/app/admin/users/page.tsx` — 使用者管理
- `src/app/admin/matches/page.tsx` — 媒合管理
- `src/app/admin/content/page.tsx` — 內容管理
- `src/app/admin/market/page.tsx` — 家教行情分析
- `src/lib/market.ts` — 行情彙總純函式
- `src/lib/market.test.ts` — 行情彙總自檢（tsx 可跑）

修改：
- `prisma/schema.prisma` — `User` 加 `disabled`
- `src/auth.ts` — 停用帳號不得登入
- `src/app/admin/actions.ts` — 加 5 個審核 action
- `src/app/admin/verifications/page.tsx` — 移除逐頁權限閘（改由 layout 把關）
- `src/components/Navbar.tsx` — ADMIN 顯示「管理後台」入口

---

## Task 1: Schema 加 `disabled` 欄位

**Files:**
- Modify: `prisma/schema.prisma`（`User` model，約 line 70-72 的認證旗標附近）

- [ ] **Step 1: 在 `User` model 加欄位**

在 `eduVerified` 那行之後（[schema.prisma:72](../../../prisma/schema.prisma#L72)）加入：

```prisma
  // 帳號狀態
  disabled        Boolean @default(false) // admin 停用帳號（停用後無法登入；既有 JWT session 自然到期前仍有效）
```

- [ ] **Step 2: 跑 migration（同時重新產生 client）**

Run: `npx prisma migrate dev --name add_user_disabled`
Expected: 建立 migration 檔，輸出 `Your database is now in sync with your schema.`，並重新產生 `src/generated/prisma`。

> 註：本專案用 Neon，migration 走 `DIRECT_URL`（見 schema 的 `directUrl`）。本機需有 `.env` 的 `DIRECT_URL`。若無法連 DB，改跑 `npx prisma generate` 先讓型別可用，migration 留待有 DB 時補。

- [ ] **Step 3: 確認型別已更新**

Run: `npx tsc --noEmit`
Expected: PASS（`disabled` 已存在於產生的 `User` 型別，無錯誤）。

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat(admin): User 加 disabled 欄位"
```

---

## Task 2: 停用帳號不得登入

**Files:**
- Modify: `src/auth.ts:17-21`

- [ ] **Step 1: 在 `authorize()` 加停用檢查**

把 [auth.ts:17-21](../../../src/auth.ts#L17-L21) 從：

```ts
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
```

改為：

```ts
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        // 停用帳號不得登入（回 null＝與密碼錯誤同樣的一般失敗，不洩漏帳號狀態）
        if (user.disabled) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add src/auth.ts
git commit -m "feat(admin): 停用帳號不得登入"
```

---

## Task 3: Admin 殼（layout + 側欄 + Navbar 入口）

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/AdminNav.tsx`
- Modify: `src/app/admin/verifications/page.tsx:12-21`（移除逐頁權限閘）
- Modify: `src/components/Navbar.tsx:53-55`（加 admin 入口）

- [ ] **Step 1: 建 `AdminNav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/users", label: "使用者" },
  { href: "/admin/matches", label: "媒合" },
  { href: "/admin/content", label: "內容" },
  { href: "/admin/market", label: "行情" },
  { href: "/admin/verifications", label: "認證審核" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-40 sm:flex-col sm:overflow-visible">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${
              active
                ? "bg-sun text-paper"
                : "text-ink/70 hover:bg-sun-soft/40"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: 建 `admin/layout.tsx`（整區單一 ADMIN 閘）**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        此頁面僅限管理員。
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: 移除 verifications 的逐頁權限閘**

把 [verifications/page.tsx:12-21](../../../src/app/admin/verifications/page.tsx#L12-L21)：

```tsx
export default async function AdminVerificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        此頁面僅限管理員。
      </div>
    );
  }

  const requests = await db.verificationRequest.findMany({
```

改為（權限已由 layout 把關，這裡不再需要 session/redirect）：

```tsx
export default async function AdminVerificationsPage() {
  const requests = await db.verificationRequest.findMany({
```

同時刪掉該檔頂部不再使用的 import：`import { redirect } from "next/navigation";` 與 `import { auth } from "@/auth";`（確認檔內無其他用到 `auth`/`redirect` 處再刪）。並把外層容器 `className="mx-auto max-w-3xl px-4 py-10"` 改為 `className="max-w-3xl"`（置中與 padding 已由 layout 的 `main` 提供）。

- [ ] **Step 4: Navbar 加 admin 入口**

在 [Navbar.tsx:53-55](../../../src/components/Navbar.tsx#L53-L55) 的 `討論區` Link 之後加入：

```tsx
          <Link href="/forum" className="transition hover:text-cobalt">
            討論區
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="transition hover:text-cobalt"
            >
              管理後台
            </Link>
          )}
```

- [ ] **Step 5: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

Run: `npm run dev`，以 ADMIN 帳號開 `/admin/verifications` → 應看到左側欄 + 原本的審核列表；以非 ADMIN 帳號開 → 「此頁面僅限管理員」；未登入開 → 轉到 `/login`。

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/layout.tsx src/components/AdminNav.tsx src/app/admin/verifications/page.tsx src/components/Navbar.tsx
git commit -m "feat(admin): admin 殼（layout 權限閘 + 側欄 + navbar 入口）"
```

---

## Task 4: 審核 server actions

**Files:**
- Modify: `src/app/admin/actions.ts`（在既有 `approveVerification`/`rejectVerification` 之後追加）

用 `updateMany`/`deleteMany`：目標不存在時為 no-op、不丟例外，天然滿足「靜默 return」。

- [ ] **Step 1: 追加 5 個 action**

在 [actions.ts](../../../src/app/admin/actions.ts) 檔尾（`rejectVerification` 之後）加入：

```ts
// 停用／復用使用者
export async function setUserDisabled(id: string, disabled: boolean) {
  if (!(await requireAdmin())) return;
  await db.user.updateMany({ where: { id }, data: { disabled } });
  revalidatePath("/admin/users");
}

// 強制關閉案件
export async function closeJob(id: string) {
  if (!(await requireAdmin())) return;
  await db.jobPost.updateMany({
    where: { id, status: { not: "CLOSED" } },
    data: { status: "CLOSED" },
  });
  revalidatePath("/admin/matches");
}

// 刪除論壇文章（回覆由 schema onDelete: Cascade 連帶刪除）
export async function deleteForumPost(id: string) {
  if (!(await requireAdmin())) return;
  await db.forumPost.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}

// 刪除論壇回覆
export async function deleteForumReply(id: string) {
  if (!(await requireAdmin())) return;
  await db.forumReply.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}

// 刪除評價
export async function deleteReview(id: string) {
  if (!(await requireAdmin())) return;
  await db.review.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/actions.ts
git commit -m "feat(admin): 審核 server actions（停用/關閉案件/刪內容）"
```

---

## Task 5: 數據儀表板 `/admin`

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: 建儀表板頁**

```tsx
import { db } from "@/lib/db";

export const metadata = { title: "後台總覽 · TutorMatch" };

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "家長／學生",
  TUTOR: "老師",
  ADMIN: "管理員",
};
const JOB_LABEL: Record<string, string> = {
  OPEN: "徵求中",
  MATCHED: "已媒合",
  CLOSED: "已關閉",
};
const APP_LABEL: Record<string, string> = {
  PENDING: "待回覆",
  ACCEPTED: "已接受",
  REJECTED: "已婉拒",
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="text-3xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-sm font-bold text-ink/60">{label}</div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    usersByRole,
    jobsByStatus,
    appsByStatus,
    pendingVer,
    forumPosts,
    reviews,
    newUsers,
    newJobs,
    newApps,
  ] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.jobPost.groupBy({ by: ["status"], _count: { _all: true } }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.forumPost.count(),
    db.review.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.jobPost.count({ where: { createdAt: { gte: since } } }),
    db.application.count({ where: { createdAt: { gte: since } } }),
  ]);

  const roleCount = (r: string) =>
    usersByRole.find((g) => g.role === r)?._count._all ?? 0;
  const jobCount = (s: string) =>
    jobsByStatus.find((g) => g.status === s)?._count._all ?? 0;
  const appCount = (s: string) =>
    appsByStatus.find((g) => g.status === s)?._count._all ?? 0;

  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold text-ink">後台總覽</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">使用者</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(ROLE_LABEL).map((r) => (
          <Stat key={r} label={ROLE_LABEL[r]} value={roleCount(r)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">案件</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(JOB_LABEL).map((s) => (
          <Stat key={s} label={JOB_LABEL[s]} value={jobCount(s)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">應徵</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(APP_LABEL).map((s) => (
          <Stat key={s} label={APP_LABEL[s]} value={appCount(s)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">內容與待辦</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="待審認證" value={pendingVer} />
        <Stat label="論壇文章" value={forumPosts} />
        <Stat label="評價" value={reviews} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">近 7 日新增</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="新使用者" value={newUsers} />
        <Stat label="新案件" value={newJobs} />
        <Stat label="新應徵" value={newApps} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

以 ADMIN 開 `/admin`，應看到各分組數字卡片。

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): 數據儀表板"
```

---

## Task 6: 使用者管理 `/admin/users`

**Files:**
- Create: `src/app/admin/users/page.tsx`

篩選：`?role=`；搜尋：`?q=`（name/email，不分大小寫）；分頁：`?page=`，每頁 50 筆。停用/復用按鈕綁 `setUserDisabled`。

- [ ] **Step 1: 建使用者管理頁**

```tsx
import Link from "next/link";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { setUserDisabled } from "@/app/admin/actions";

export const metadata = { title: "使用者管理 · TutorMatch" };

const PER = 50;
const ROLES = ["STUDENT", "TUTOR", "ADMIN"] as const;
const ROLE_LABEL: Record<string, string> = {
  STUDENT: "家長／學生",
  TUTOR: "老師",
  ADMIN: "管理員",
};

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const role = str(sp.role);
  const q = str(sp.q).trim();
  const page = Math.max(1, parseInt(str(sp.page)) || 1);

  const where: Prisma.UserWhereInput = {};
  if (ROLES.includes(role as (typeof ROLES)[number])) {
    where.role = role as (typeof ROLES)[number];
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        role: true,
        idVerified: true,
        bgCheckVerified: true,
        eduVerified: true,
        disabled: true,
        createdAt: true,
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  // 篩選列保留搜尋字；分頁列保留 role/q
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (role) p.set("role", role);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(over)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold text-ink">使用者管理</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 mb-5 text-sm font-bold text-ink/60">共 {total} 人</p>

      {/* 篩選 + 搜尋 */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
            role ? "text-ink/60" : "bg-sun text-paper"
          }`}
        >
          全部
        </Link>
        {ROLES.map((r) => {
          const p = new URLSearchParams();
          p.set("role", r);
          if (q) p.set("q", q);
          return (
            <Link
              key={r}
              href={`/admin/users?${p.toString()}`}
              className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
                role === r ? "bg-sun text-paper" : "text-ink/60"
              }`}
            >
              {ROLE_LABEL[r]}
            </Link>
          );
        })}
        <form className="ml-auto flex gap-2" action="/admin/users">
          {role && <input type="hidden" name="role" value={role} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="搜尋姓名／Email"
            className="rounded-full border border-line px-3 py-1 text-sm"
          />
          <button className="rounded-full border border-line px-3 py-1 text-sm font-bold text-ink/70 hover:bg-sun-soft/40">
            搜尋
          </button>
        </form>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-sun-soft/30 text-left text-ink/60">
            <tr>
              <th className="px-3 py-2 font-bold">使用者</th>
              <th className="px-3 py-2 font-bold">角色</th>
              <th className="px-3 py-2 font-bold">認證</th>
              <th className="px-3 py-2 font-bold">註冊</th>
              <th className="px-3 py-2 font-bold">狀態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <div className="font-bold text-ink">
                    {u.displayName ?? u.name}
                  </div>
                  <div className="text-xs text-ink/40">{u.email}</div>
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {ROLE_LABEL[u.role]}
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {[
                    u.idVerified && "實名",
                    u.bgCheckVerified && "良民",
                    u.eduVerified && "學歷",
                  ]
                    .filter(Boolean)
                    .join("・") || "—"}
                </td>
                <td className="px-3 py-2 text-ink/50">
                  {u.createdAt.toLocaleDateString("zh-TW")}
                </td>
                <td className="px-3 py-2">
                  {u.disabled ? (
                    <span className="rounded-full bg-blush/20 px-2 py-0.5 text-xs font-bold text-blush">
                      已停用
                    </span>
                  ) : (
                    <span className="text-xs text-ink/40">啟用中</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {u.role !== "ADMIN" && (
                    <form
                      action={setUserDisabled.bind(null, u.id, !u.disabled)}
                    >
                      <button className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/70 hover:bg-sun-soft/40">
                        {u.disabled ? "復用" : "停用"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-ink/40">
                  沒有符合的使用者。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/admin/users${qs({ page: String(page - 1) })}`} className="font-bold text-cobalt">
              ← 上一頁
            </Link>
          )}
          <span className="text-ink/50">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link href={`/admin/users${qs({ page: String(page + 1) })}`} className="font-bold text-cobalt">
              下一頁 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

開 `/admin/users`：角色篩選、搜尋、分頁可動；按「停用」後該列顯示「已停用」；ADMIN 列無停用鈕。

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): 使用者管理（篩選/搜尋/分頁/停用）"
```

---

## Task 7: 媒合管理 `/admin/matches`

**Files:**
- Create: `src/app/admin/matches/page.tsx`

篩選：`?status=`；分頁 `?page=`，每頁 50 筆。顯示應徵數與已媒合老師（status=ACCEPTED 的應徵對應老師）。動作：強制關閉。

- [ ] **Step 1: 建媒合管理頁**

```tsx
import Link from "next/link";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { closeJob } from "@/app/admin/actions";

export const metadata = { title: "媒合管理 · TutorMatch" };

const PER = 50;
const STATUSES = ["OPEN", "MATCHED", "CLOSED"] as const;
const STATUS_LABEL: Record<string, string> = {
  OPEN: "徵求中",
  MATCHED: "已媒合",
  CLOSED: "已關閉",
};

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const status = str(sp.status);
  const page = Math.max(1, parseInt(str(sp.page)) || 1);

  const where: Prisma.JobPostWhereInput = {};
  if (STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status as (typeof STATUSES)[number];
  }

  const [total, jobs] = await Promise.all([
    db.jobPost.count({ where }),
    db.jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: {
        id: true,
        title: true,
        subject: true,
        region: true,
        status: true,
        createdAt: true,
        _count: { select: { applications: true } },
        applications: {
          where: { status: "ACCEPTED" },
          take: 1,
          select: {
            tutor: {
              select: {
                user: { select: { name: true, displayName: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold text-ink">媒合管理</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 mb-5 text-sm font-bold text-ink/60">共 {total} 件</p>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/matches"
          className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
            status ? "text-ink/60" : "bg-sun text-paper"
          }`}
        >
          全部
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/matches?status=${s}`}
            className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
              status === s ? "bg-sun text-paper" : "text-ink/60"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-sun-soft/30 text-left text-ink/60">
            <tr>
              <th className="px-3 py-2 font-bold">案件</th>
              <th className="px-3 py-2 font-bold">科目</th>
              <th className="px-3 py-2 font-bold">地區</th>
              <th className="px-3 py-2 font-bold">狀態</th>
              <th className="px-3 py-2 font-bold">應徵</th>
              <th className="px-3 py-2 font-bold">已媒合</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const matched = j.applications[0]?.tutor.user;
              return (
                <tr key={j.id} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">{j.title}</td>
                  <td className="px-3 py-2 text-ink/70">{j.subject}</td>
                  <td className="px-3 py-2 text-ink/70">{j.region}</td>
                  <td className="px-3 py-2 text-ink/70">
                    {STATUS_LABEL[j.status]}
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {j._count.applications}
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {matched ? (matched.displayName ?? matched.name) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {j.status !== "CLOSED" && (
                      <form action={closeJob.bind(null, j.id)}>
                        <button className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/70 hover:bg-sun-soft/40">
                          關閉
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-ink/40">
                  沒有符合的案件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/matches?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) }).toString()}`}
              className="font-bold text-cobalt"
            >
              ← 上一頁
            </Link>
          )}
          <span className="text-ink/50">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link
              href={`/admin/matches?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) }).toString()}`}
              className="font-bold text-cobalt"
            >
              下一頁 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

開 `/admin/matches`：狀態篩選可動；OPEN 案件按「關閉」後狀態變「已關閉」、關閉鈕消失。

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/matches/page.tsx
git commit -m "feat(admin): 媒合管理（篩選/應徵數/已媒合/強制關閉）"
```

---

## Task 8: 內容管理 `/admin/content`

**Files:**
- Create: `src/app/admin/content/page.tsx`

三區塊（論壇文章／回覆／評價）各取最新 50 筆，各帶刪除鈕。

- [ ] **Step 1: 建內容管理頁**

```tsx
import { db } from "@/lib/db";
import {
  deleteForumPost,
  deleteForumReply,
  deleteReview,
} from "@/app/admin/actions";

export const metadata = { title: "內容管理 · TutorMatch" };

const PER = 50;
const BOARD_LABEL: Record<string, string> = {
  TUTOR: "老師區",
  PARENT: "家長區",
};

function name(u: { name: string; displayName: string | null }) {
  return u.displayName ?? u.name;
}

function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-bold text-blush hover:bg-blush/10">
        刪除
      </button>
    </form>
  );
}

export default async function AdminContentPage() {
  const [posts, replies, reviews] = await Promise.all([
    db.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        board: true,
        title: true,
        anonymous: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        _count: { select: { replies: true } },
      },
    }),
    db.forumReply.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        body: true,
        anonymous: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        post: { select: { title: true } },
      },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        reviewee: { select: { name: true, displayName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-ink">內容管理</h1>
        <div className="mt-2 h-1 w-14 bg-sun" />
      </div>

      {/* 論壇文章 */}
      <section>
        <h2 className="mb-3 font-bold text-ink">論壇文章（最新 {posts.length}）</h2>
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-line px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-ink">
                  <span className="mr-2 rounded bg-sun-soft/50 px-1.5 py-0.5 text-xs text-ink/60">
                    {BOARD_LABEL[p.board]}
                  </span>
                  {p.title}
                </div>
                <div className="text-xs text-ink/40">
                  {p.anonymous ? "匿名" : name(p.author)} ・ {p._count.replies} 則回覆 ・{" "}
                  {p.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteForumPost.bind(null, p.id)} />
            </li>
          ))}
          {posts.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>

      {/* 論壇回覆 */}
      <section>
        <h2 className="mb-3 font-bold text-ink">論壇回覆（最新 {replies.length}）</h2>
        <ul className="space-y-2">
          {replies.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-line px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink">{r.body}</div>
                <div className="text-xs text-ink/40">
                  {r.anonymous ? "匿名" : name(r.author)} ・ 於「{r.post.title}」 ・{" "}
                  {r.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteForumReply.bind(null, r.id)} />
            </li>
          ))}
          {replies.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>

      {/* 評價 */}
      <section>
        <h2 className="mb-3 font-bold text-ink">評價（最新 {reviews.length}）</h2>
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-line px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink">
                  <span className="mr-2 font-bold text-sun-dark">
                    {"★".repeat(r.rating)}
                  </span>
                  {r.comment ?? <span className="text-ink/40">（無留言）</span>}
                </div>
                <div className="text-xs text-ink/40">
                  {name(r.author)} → {name(r.reviewee)} ・{" "}
                  {r.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteReview.bind(null, r.id)} />
            </li>
          ))}
          {reviews.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

開 `/admin/content`：三區塊各列出內容；按任一「刪除」該列消失。

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/content/page.tsx
git commit -m "feat(admin): 內容管理（論壇文章/回覆/評價刪除）"
```

---

## Task 9: 家教行情分析 `/admin/market`（含純函式 + 自檢）

**Files:**
- Create: `src/lib/market.ts`
- Create: `src/lib/market.test.ts`
- Create: `src/app/admin/market/page.tsx`

把行情彙總抽成 pure function（可測、不碰 DB），admin 版納入未上架老師、加地區維度與供需對比。

- [ ] **Step 1: 寫 `market.ts` 純函式**

```ts
// 行情彙總（純函式，不碰 DB）：給定老師與案件清單，算各維度時薪統計。
// admin 行情頁用；與 /stats 的公開估算（lib/estimate.ts）分工：這裡是描述性統計。

export type RateRow = {
  key: string;
  count: number;
  avg: number;
  min: number;
  max: number;
};

export type TutorLite = {
  hourlyRate: number | null;
  subjects: string[];
  levels: string[];
  regions: string[];
};

export type JobLite = { budget: number | null };

export type MarketBreakdown = {
  bySubject: RateRow[];
  byLevel: RateRow[];
  byRegion: RateRow[];
  supplyAvg: number; // 老師平均時薪
  demandAvg: number; // 家長平均預算
  tutorCount: number;
  jobCount: number;
};

// 一組時薪 → 統計列（空集合回 0）
export function rateRow(key: string, rates: number[]): RateRow {
  if (rates.length === 0) return { key, count: 0, avg: 0, min: 0, max: 0 };
  const sum = rates.reduce((a, b) => a + b, 0);
  return {
    key,
    count: rates.length,
    avg: Math.round(sum / rates.length),
    min: Math.min(...rates),
    max: Math.max(...rates),
  };
}

function nums(xs: (number | null)[]): number[] {
  return xs.filter((x): x is number => typeof x === "number" && x > 0);
}

export function aggregateMarket(
  tutors: TutorLite[],
  jobs: JobLite[],
  dims: {
    subjects: readonly string[];
    levels: readonly string[];
    regions: readonly string[];
  }
): MarketBreakdown {
  const rateOf = (pred: (t: TutorLite) => boolean) =>
    nums(tutors.filter(pred).map((t) => t.hourlyRate));

  const bySubject = dims.subjects
    .map((s) => rateRow(s, rateOf((t) => t.subjects.includes(s))))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const byLevel = dims.levels
    .map((l) => rateRow(l, rateOf((t) => t.levels.includes(l))))
    .filter((r) => r.count > 0);

  const byRegion = dims.regions
    .map((r) => rateRow(r, rateOf((t) => t.regions.includes(r))))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const supply = nums(tutors.map((t) => t.hourlyRate));
  const demand = nums(jobs.map((j) => j.budget));

  return {
    bySubject,
    byLevel,
    byRegion,
    supplyAvg: rateRow("supply", supply).avg,
    demandAvg: rateRow("demand", demand).avg,
    tutorCount: tutors.length,
    jobCount: jobs.length,
  };
}
```

- [ ] **Step 2: 寫自檢 `market.test.ts`**

```ts
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
```

- [ ] **Step 3: 跑自檢，先確認會抓到錯（紅）**

暫時把 `market.ts` 的 `rateRow` 的 `avg` 改成 `sum`（故意算錯），然後：

Run: `npx tsx src/lib/market.test.ts`
Expected: FAIL，`AssertionError`（avg 不等於 400）。

改回 `Math.round(sum / rates.length)`。

- [ ] **Step 4: 跑自檢，確認通過（綠）**

Run: `npx tsx src/lib/market.test.ts`
Expected: 印出 `market.test.ts OK`，exit 0。

- [ ] **Step 5: 建行情頁，使用該純函式**

```tsx
import { db } from "@/lib/db";
import { SUBJECTS, LEVELS, REGIONS } from "@/lib/constants";
import { aggregateMarket, type RateRow } from "@/lib/market";

export const metadata = { title: "家教行情分析 · TutorMatch" };

function RateTable({ title, rows }: { title: string; rows: RateRow[] }) {
  return (
    <section>
      <h2 className="mb-3 font-bold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/40">尚無資料</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-sun-soft/30 text-left text-ink/60">
              <tr>
                <th className="px-3 py-2 font-bold">維度</th>
                <th className="px-3 py-2 font-bold">樣本</th>
                <th className="px-3 py-2 font-bold">平均</th>
                <th className="px-3 py-2 font-bold">最低</th>
                <th className="px-3 py-2 font-bold">最高</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">{r.key}</td>
                  <td className="px-3 py-2 text-ink/50">{r.count}</td>
                  <td className="px-3 py-2 font-bold text-ink">${r.avg}</td>
                  <td className="px-3 py-2 text-ink/60">${r.min}</td>
                  <td className="px-3 py-2 text-ink/60">${r.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminMarketPage() {
  // admin 版：納入未上架老師（公開 /stats 只取 isPublished）
  const [tutors, jobs] = await Promise.all([
    db.tutorProfile.findMany({
      select: { hourlyRate: true, subjects: true, levels: true, regions: true },
    }),
    db.jobPost.findMany({ select: { budget: true } }),
  ]);

  const m = aggregateMarket(tutors, jobs, {
    subjects: SUBJECTS,
    levels: LEVELS,
    regions: REGIONS,
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-ink">
          家教行情分析
        </h1>
        <div className="mt-2 h-1 w-14 bg-sun" />
        <p className="mt-3 text-sm font-bold text-ink/60">
          含未上架老師。供給（老師時薪）平均 ${m.supplyAvg} ・ 需求（家長預算）平均 $
          {m.demandAvg} ・ {m.tutorCount} 位老師 / {m.jobCount} 件案件
        </p>
      </div>

      <RateTable title="依科目" rows={m.bySubject} />
      <RateTable title="依學制" rows={m.byLevel} />
      <RateTable title="依地區" rows={m.byRegion} />
    </div>
  );
}
```

- [ ] **Step 6: 型別檢查 + 手動驗證**

Run: `npx tsc --noEmit`
Expected: PASS。

開 `/admin/market`：顯示供需平均與依科目／學制／地區三張表。

- [ ] **Step 7: Commit**

```bash
git add src/lib/market.ts src/lib/market.test.ts src/app/admin/market/page.tsx
git commit -m "feat(admin): 家教行情分析（純函式彙總 + 自檢 + 頁面）"
```

---

## 收尾驗證

- [ ] **全站型別 + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 皆 PASS。

- [ ] **行情自檢**

Run: `npx tsx src/lib/market.test.ts`
Expected: `market.test.ts OK`。

- [ ] **手動走一遍**：以 ADMIN 登入，Navbar 出現「管理後台」；側欄六頁皆可開；停用一個測試帳號後該帳號無法登入（驗證 Task 2）。
