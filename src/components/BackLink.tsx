import Link from "next/link";

export default function BackLink({
  href,
  children,
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-bold text-ink/70 transition hover:bg-sun-soft/60 hover:text-ink"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
