"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type ActionState } from "@/app/(auth)/actions";
import { Field, SubmitButton, useFocusFirstError } from "@/components/ui/form";

const initialState: ActionState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, initialState);
  useFocusFirstError(state);

  if (state.success) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-cobalt hover:underline"
        >
          前往登入 →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="新密碼"
        name="next"
        type="password"
        required
        hint="至少 8 字元，需含英文字母與數字"
        errors={state.fieldErrors?.next}
      />
      <Field
        label="確認新密碼"
        name="confirm"
        type="password"
        required
        errors={state.fieldErrors?.confirm}
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton>設定新密碼</SubmitButton>
    </form>
  );
}
