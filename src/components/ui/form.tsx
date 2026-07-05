"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

// 送出後有欄位錯誤時，捲動並聚焦到「畫面上第一個」出錯欄位，
// 長表單的錯誤不會被埋在視窗外。fieldErrors 的 key 需對應欄位 name。
export function useFocusFirstError(state: {
  fieldErrors?: Record<string, string[]>;
}) {
  useEffect(() => {
    const keys = state.fieldErrors ? Object.keys(state.fieldErrors) : [];
    if (!keys.length) return;
    const selector = keys.map((k) => `[name="${k}"]`).join(",");
    // querySelectorAll 依 DOM 順序回傳 → 取第一個看得到的欄位
    const target = [...document.querySelectorAll<HTMLElement>(selector)].find(
      (el) => el.offsetParent !== null
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
  }, [state]);
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  errors,
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  errors?: string[];
  defaultValue?: string;
  required?: boolean;
  // 欄位限制提示，填寫前就顯示（灰字）；出錯時改顯示紅色錯誤
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-bold text-ink">
        {label}
        {required && <span className="ml-0.5 text-blush">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={errors?.length ? true : undefined}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none transition placeholder:text-ink/40 focus:bg-sun-soft/40 aria-[invalid]:border-blush"
      />
      {errors?.length ? (
        errors.map((e) => (
          <p key={e} className="text-xs font-bold text-blush">
            {e}
          </p>
        ))
      ) : hint ? (
        <p className="text-xs text-ink/40">{hint}</p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  children,
  fullWidth = true,
}: {
  children: React.ReactNode;
  // 預設滿版；fullWidth={false} 改為置中、寬度貼齊文字
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full border border-line bg-sun py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark disabled:cursor-not-allowed disabled:opacity-50 ${
        fullWidth ? "w-full px-4" : "mx-auto block px-8"
      }`}
    >
      {pending ? "處理中…" : children}
    </button>
  );
}
