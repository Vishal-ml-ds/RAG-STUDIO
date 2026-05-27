import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-panel/80 p-8 shadow-panel backdrop-blur">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to open the Studio.
        </p>
      </div>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-text-tertiary">
        New here?{" "}
        <Link
          href="/register"
          className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
