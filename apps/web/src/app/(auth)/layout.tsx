import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-70"
      />

      <header className="relative">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">
              R
            </span>
            <span>RAG Studio</span>
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
