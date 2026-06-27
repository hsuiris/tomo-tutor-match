import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // 角色決定主面板：老師找學生、家長找老師。未登入訪客兩者皆可瀏覽。
  const isTutor = user?.role === "TUTOR";
  const showFindTutors = !user || !isTutor; // 家長/學生/訪客
  const showFindStudents = !user || isTutor; // 老師/訪客

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-serif text-2xl font-extrabold tracking-tight text-ink"
        >
          TutorMatch
        </Link>

        <div className="hidden items-center gap-7 text-sm font-bold text-ink sm:flex">
          {showFindTutors && (
            <Link
              href="/match"
              className="inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-paper transition hover:bg-sun-dark"
            >
              ✨ 智能匹配
            </Link>
          )}
          {showFindTutors && (
            <Link href="/tutors" className="transition hover:text-cobalt">
              找老師
            </Link>
          )}
          {showFindStudents && isTutor && (
            <Link
              href="/jobs/match"
              className="inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-paper transition hover:bg-sun-dark"
            >
              ✨ 智能接案
            </Link>
          )}
          {showFindStudents && (
            <Link href="/jobs" className="transition hover:text-cobalt">
              找學生
            </Link>
          )}
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
                <span className="text-blush">♥</span> 收藏
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
                <span className="rounded-full bg-sun px-1.5 py-0.5 text-[10px] font-bold text-paper">
                  {user.role === "TUTOR"
                    ? "老師"
                    : user.role === "ADMIN"
                      ? "管理員"
                      : "家長"}
                </span>
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
