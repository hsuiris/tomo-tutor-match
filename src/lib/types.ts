// Server action 的共用回傳型別
export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  // 由 client 端在收到後導轉（server action 的 redirect() 在 useActionState 下不會驅動瀏覽器導航）
  redirectTo?: string;
};
