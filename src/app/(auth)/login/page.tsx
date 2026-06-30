"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser, type ActionState } from "../actions";
import { Field, SubmitButton } from "@/components/ui/form";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginUser, initialState);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-extrabold text-ink">登入</h1>
      <p className="mb-6 text-sm text-ink/60">歡迎回來 Tomo</p>

      <form action={formAction} className="space-y-4">
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
          required
          errors={state.fieldErrors?.password}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-cobalt hover:underline"
          >
            忘記密碼？
          </Link>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton>登入</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        還沒有帳號？{" "}
        <Link
          href="/register"
          className="font-medium text-cobalt hover:underline"
        >
          立即註冊
        </Link>
      </p>
    </div>
  );
}
