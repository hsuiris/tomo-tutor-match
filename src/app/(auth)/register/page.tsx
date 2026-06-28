"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerUser, type ActionState } from "../actions";
import { Field, SubmitButton } from "@/components/ui/form";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, initialState);
  const [role, setRole] = useState<"STUDENT" | "TUTOR">("STUDENT");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNDISCLOSED">(
    "UNDISCLOSED"
  );

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-extrabold text-ink">建立帳號</h1>
      <p className="mb-6 text-sm text-ink/60">加入 Tomo，開始找家教或接案</p>

      <form action={formAction} className="space-y-4">
        {/* 身分選擇 */}
        <div className="space-y-1">
          <span className="block text-sm font-medium text-ink/80">
            我想要<span className="ml-0.5 text-red-500">*</span>
          </span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "STUDENT", label: "找家教", desc: "我是學生／家長" },
                { value: "TUTOR", label: "接案教學", desc: "我是家教老師" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-lg border p-3 text-center transition ${
                  role === opt.value
                    ? "border-line bg-sun"
                    : "border-line hover:border-line"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  className="sr-only"
                />
                <span
                  className={`block text-sm font-bold ${
                    role === opt.value ? "text-paper" : "text-ink"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`block text-xs ${
                    role === opt.value ? "text-paper/80" : "text-ink/60"
                  }`}
                >
                  {opt.desc}
                </span>
              </label>
            ))}
          </div>
          {state.fieldErrors?.role?.map((e) => (
            <p key={e} className="text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>

        {/* 性別 */}
        <div className="space-y-1">
          <span className="block text-sm font-medium text-ink/80">
            性別<span className="ml-0.5 text-red-500">*</span>
          </span>
          <div className="flex gap-2">
            {(
              [
                { value: "MALE", label: "男" },
                { value: "FEMALE", label: "女" },
                { value: "UNDISCLOSED", label: "不公開" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 cursor-pointer rounded-lg border py-2 text-center text-sm transition ${
                  gender === opt.value
                    ? "border-line bg-sun text-paper"
                    : "border-line text-ink/70 hover:border-line"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={gender === opt.value}
                  onChange={() => setGender(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {state.fieldErrors?.gender?.map((e) => (
            <p key={e} className="text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>

        <Field
          label="姓名"
          name="name"
          placeholder="王小明"
          required
          errors={state.fieldErrors?.name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          errors={state.fieldErrors?.email}
        />
        <Field
          label="密碼"
          name="password"
          type="password"
          placeholder="至少 6 個字元"
          required
          errors={state.fieldErrors?.password}
        />
        <Field
          label="確認密碼"
          name="confirmPassword"
          type="password"
          required
          errors={state.fieldErrors?.confirmPassword}
        />

        {/* 個資蒐集同意 */}
        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              name="consent"
              className="mt-0.5 shrink-0"
            />
            <span>
              我已閱讀並同意{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-cobalt hover:underline"
              >
                隱私權政策與個資蒐集告知
              </Link>
              <span className="ml-0.5 text-red-500">*</span>
            </span>
          </label>
          {state.fieldErrors?.consent?.map((e) => (
            <p key={e} className="text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton>註冊</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        已經有帳號了？{" "}
        <Link href="/login" className="font-medium text-cobalt hover:underline">
          登入
        </Link>
      </p>
    </div>
  );
}
