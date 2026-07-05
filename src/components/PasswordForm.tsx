"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/dashboard/account/actions";
import { Field, SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="目前密碼"
        name="current"
        type="password"
        required
        errors={state.fieldErrors?.current}
      />
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
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success} ✓</p>
      )}
      <SubmitButton>更新密碼</SubmitButton>
    </form>
  );
}
