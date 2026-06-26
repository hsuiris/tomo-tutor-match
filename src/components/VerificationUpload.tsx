"use client";

import { useActionState, useState } from "react";
import { submitVerification } from "@/app/dashboard/account/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function VerificationUpload({
  type,
  label,
}: {
  type: "IDENTITY" | "BACKGROUND" | "EDUCATION";
  label: string;
}) {
  const [state, formAction] = useActionState(submitVerification, initialState);
  const [doc, setDoc] = useState("");
  const [err, setErr] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("請選擇圖片檔");
    if (file.size > 3 * 1024 * 1024) return setErr("圖片請小於 3MB");
    setErr("");
    const r = new FileReader();
    r.onload = () => setDoc(r.result as string);
    r.readAsDataURL(file);
  }

  if (state.success) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        審核中 ⏳ {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="docUrl" value={doc} />
      <label className="inline-block cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-sun-soft/40">
        {doc ? "已選擇檔案,可重新選擇" : `上傳${label}`}
        <input
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
      </label>
      {doc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={doc}
          alt="預覽"
          className="h-20 rounded border border-line object-cover"
        />
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      {doc && <SubmitButton>送出審核</SubmitButton>}
    </form>
  );
}
