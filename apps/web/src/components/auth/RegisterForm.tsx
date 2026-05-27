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
  name: z
    .string()
    .max(255, "Name is too long")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128, "Password is too long"),
});

type RegisterValues = z.infer<typeof schema>;

interface RegisterResponseBody {
  detail?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name?.trim() ? values.name.trim() : null,
        }),
      });

      if (!res.ok) {
        const body = (await safeJson(res)) as RegisterResponseBody | null;
        setServerError(body?.detail ?? "Could not create your account.");
        return;
      }

      // Auto-login after register.
      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      if (!login.ok) {
        router.replace("/login");
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
      <FormField label="Name" htmlFor="register-name" error={errors.name?.message}>
        <Input
          id="register-name"
          autoComplete="name"
          placeholder="Optional"
          invalid={!!errors.name}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor="register-email"
        error={errors.email?.message}
      >
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.local"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="register-password"
        hint="Minimum 8 characters."
        error={errors.password?.message}
      >
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
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
        Create account
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
