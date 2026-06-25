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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  errors?: string[];
  defaultValue?: string;
  required?: boolean;
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
      {errors?.map((e) => (
        <p key={e} className="text-xs font-bold text-blush">
          {e}
        </p>
      ))}
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-line bg-sun px-4 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "處理中…" : children}
    </button>
  );
}
