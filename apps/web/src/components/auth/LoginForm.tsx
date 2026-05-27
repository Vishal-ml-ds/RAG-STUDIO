"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof schema>;

interface LoginResponseBody {
  detail?: string;
}

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = (await safeJson(res)) as LoginResponseBody | null;
        setServerError(body?.detail ?? "Could not sign in. Check your credentials.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setServerError("Network error. Is the API running?");
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <FormField
        label="Email"
        htmlFor="login-email"
        error={errors.email?.message}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.local"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="login-password"
        error={errors.password?.message}
      >
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
        >
          {serverError}
        </div>
      ) : null}

      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
        Sign in
      </Button>
    </form>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
