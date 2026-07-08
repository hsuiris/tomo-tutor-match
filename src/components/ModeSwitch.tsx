import { redirect } from "next/navigation";
import { getMode, MODE_COOKIE, parseMode, type Mode } from "@/lib/mode";

// 身份切換：設 cookie 後導到該身份的主頁，給明確回饋（家長→找老師、老師→找學生）。
async function switchMode(formData: FormData) {
  "use server";
  const mode = parseMode(formData.get("mode")?.toString());
  const { cookies } = await import("next/headers");
  (await cookies()).set(MODE_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 一年
    sameSite: "lax",
  });
  redirect(mode === "teacher" ? "/jobs" : "/tutors");
}

export default async function ModeSwitch() {
  const mode = await getMode();
  return (
    <form
      action={switchMode}
      className="flex items-center rounded-full border border-line bg-paper p-0.5 text-sm font-bold"
      aria-label="切換身份"
    >
      {(["parent", "teacher"] as Mode[]).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            name="mode"
            value={m}
            aria-pressed={active}
            className={
              "rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt " +
              (active ? "bg-ink text-paper" : "text-ink/55 hover:text-ink")
            }
          >
            {m === "parent" ? "家長" : "老師"}
          </button>
        );
      })}
    </form>
  );
}
