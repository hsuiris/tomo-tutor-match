import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="font-serif text-6xl font-extrabold text-ink/20">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold text-ink">找不到這個頁面</h1>
      <p className="mt-2 text-ink/60">
        頁面可能已被移除，或網址輸入有誤。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:bg-ink/85"
      >
        回到首頁
      </Link>
    </div>
  );
}
