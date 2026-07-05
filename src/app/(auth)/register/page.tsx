"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerUser, type ActionState } from "../actions";
import { Field, SubmitButton, useFocusFirstError } from "@/components/ui/form";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, initialState);
  useFocusFirstError(state);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNDISCLOSED">(
    "UNDISCLOSED"
  );

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-extrabold text-ink">建立帳號</h1>
      <p className="mb-6 text-sm text-ink/60">加入 Tomo，開始找家教或接案</p>

      <form action={formAction} className="space-y-4">
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
          hint="至少 2 個字"
          defaultValue={state.values?.name}
          errors={state.fieldErrors?.name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
        />
        <Field
          label="密碼"
          name="password"
          type="password"
          placeholder="至少 8 字元，需含英文字母與數字"
          required
          hint="至少 8 字元，需含英文字母與數字"
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
                href="/terms"
                target="_blank"
                className="font-medium text-cobalt hover:underline"
              >
                服務條款
              </Link>
              {" "}與{" "}
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
