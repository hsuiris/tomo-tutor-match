"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "../actions";
import { Field, SubmitButton } from "@/components/ui/form";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-extrabold text-ink">忘記密碼</h1>
      <p className="mb-6 text-sm text-ink/60">
        輸入註冊用的 Email，我們會寄出重設密碼的連結。
      </p>

      {state.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <SubmitButton>寄送重設連結</SubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/60">
        想起來了？{" "}
        <Link href="/login" className="font-medium text-cobalt hover:underline">
          回到登入
        </Link>
      </p>
    </div>
  );
}
