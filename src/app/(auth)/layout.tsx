import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-serif text-3xl font-extrabold text-ink"
        >
          TutorMatch
        </Link>
        <div className="rounded-xl border border-line bg-paper p-8 shadow-[0_10px_30px_rgba(60,55,45,0.12)]">
          {children}
        </div>
      </div>
    </div>
  );
}
