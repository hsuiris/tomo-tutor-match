import Link from "next/link";
import { auth, signOut } from "@/auth";
import HeartIcon from "@/components/HeartIcon";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

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
                className="hidden text-sm font-bold text-ink transition hover:text-cobalt sm:block"
              >
                訊息
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
