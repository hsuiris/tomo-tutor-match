"use client";

import { useActionState, useState } from "react";
import { submitVerifications } from "@/app/dashboard/account/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 整個安全認證區共用一個表單：各列選好檔案後，由底部按鈕一次送出
export function VerificationForm({ children }: { children: React.ReactNode }) {
  const [state, formAction] = useActionState(submitVerifications, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success} ✓</p>
      )}
      <SubmitButton fullWidth={false}>儲存並上傳檢驗</SubmitButton>
    </form>
  );
}

// 單一證件選擇器（不含表單）：選好的圖片放進 hidden input，由外層表單一併送出
export default function VerificationUpload({
  type,
  label,
}: {
  type: "IDENTITY" | "EDUCATION";
  label: string;
}) {
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

  return (
    <div className="space-y-2">
      <input type="hidden" name={`doc_${type}`} value={doc} />
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
    </div>
  );
}
