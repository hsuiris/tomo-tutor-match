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

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
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
                <td className="px-3 py-2 text-ink/70">{ROLE_LABEL[u.role]}</td>
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
                    <form action={setUserDisabled.bind(null, u.id, !u.disabled)}>
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

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/users${qs({ page: String(page - 1) })}`}
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
              href={`/admin/users${qs({ page: String(page + 1) })}`}
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
