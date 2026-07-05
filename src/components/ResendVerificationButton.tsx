"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/app/(auth)/actions";

export default function ResendVerificationButton() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await resendVerificationEmail();
            setMsg(
              res.error
                ? { ok: false, text: res.error }
                : { ok: true, text: res.success ?? "已寄出" }
            );
          })
        }
        className="rounded-full border border-line bg-paper px-6 py-2.5 text-sm font-bold text-ink/80 transition hover:bg-sun-soft/50 disabled:opacity-50"
      >
        {pending ? "寄送中…" : "重寄驗證信"}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
