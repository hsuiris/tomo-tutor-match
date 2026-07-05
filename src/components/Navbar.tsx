import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import HeartIcon from "@/components/HeartIcon";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // 未讀數（訊息紅點）：對方傳來未讀的私訊 + 未讀系統通知
  let unread = 0;
  if (user) {
    const [msgs, notifs] = await Promise.all([
      db.message.count({
        where: {
          readAt: null,
          senderId: { not: user.id },
          conversation: {
            OR: [{ userAId: user.id }, { userBId: user.id }],
          },
        },
      }),
      db.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    unread = msgs + notifs;
  }

  // 帳號不分老師／學生，每個人都能找老師也能找學生
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-serif text-2xl font-extrabold tracking-tight text-ink"
        >
          Tomo
        </Link>

        <div className="hidden items-center gap-7 text-sm font-bold text-ink sm:flex">
          <Link href="/tutors" className="transition hover:text-cobalt">
            找老師
          </Link>
          <Link href="/jobs" className="transition hover:text-cobalt">
            找學生
          </Link>
          <Link href="/stats" className="transition hover:text-cobalt">
            行情統計
          </Link>
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
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/favorites"
                className="hidden items-center gap-1 text-sm font-bold text-ink transition hover:text-cobalt sm:flex"
              >
                <HeartIcon className="h-4 w-4 text-blush" fill="currentColor" /> 收藏
              </Link>
              <Link
                href="/messages"
                className="relative hidden items-center gap-1 text-sm font-bold text-ink transition hover:text-cobalt sm:flex"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-cobalt"
                >
                  <path d="M12 3C6.8 3 2.5 6.6 2.5 11.1C2.5 13.6 3.9 15.8 6 17.3C6 18.3 5.6 19.7 4.6 20.7C4.4 20.9 4.5 21.3 4.8 21.3C6.8 21.2 8.5 20.3 9.5 19C10.3 19.2 11.1 19.3 12 19.3C17.2 19.3 21.5 15.6 21.5 11.1C21.5 6.6 17.2 3 12 3Z" />
                </svg>
                訊息
                {unread > 0 && (
                  <span className="absolute -right-3.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-[10px] font-bold leading-none text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-ink transition hover:bg-sun"
              >
                {user.name}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-full border border-line px-3 py-1.5 text-sm font-bold text-ink transition hover:bg-sun hover:text-paper">
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:bg-paper"
              >
                登入
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-line bg-sun px-4 py-1.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
              >
                註冊
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
