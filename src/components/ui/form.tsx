"use client";

import { useFormStatus } from "react-dom";

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
        className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none transition placeholder:text-ink/40 focus:bg-sun-soft/40"
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
