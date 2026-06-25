"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/app/messages/actions";

export default function ContactButton({
  tutorUserId,
  label = "私訊聯絡老師",
}: {
  tutorUserId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function contact() {
    setError("");
    startTransition(async () => {
      const res = await startConversation(tutorUserId);
      if (res.error) {
        // 未登入導向登入頁
        if (res.error.includes("登入")) {
          router.push("/login");
          return;
        }
        setError(res.error);
        return;
      }
      if (res.conversationId) {
        router.push(`/messages/${res.conversationId}`);
      }
    });
  }

  return (
    <div>
      <button
        onClick={contact}
        disabled={pending}
        className="w-full rounded-full border border-line bg-sun px-4 py-2.5 text-center text-sm font-bold text-paper transition hover:bg-sun-dark disabled:opacity-50"
      >
        {pending ? "建立對話中…" : `💬 ${label}`}
      </button>
      {error && <p className="mt-2 text-xs font-bold text-blush">{error}</p>}
    </div>
  );
}
