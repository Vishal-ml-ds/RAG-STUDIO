import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-panel/80 p-8 shadow-panel backdrop-blur">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Spin up your first project in seconds.
        </p>
      </div>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-xs text-text-tertiary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
