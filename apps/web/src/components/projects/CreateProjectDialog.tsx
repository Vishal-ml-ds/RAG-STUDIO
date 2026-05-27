"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { ProjectResponse } from "@/lib/types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const close = () => {
    if (isSubmitting) return;
    setOpen(false);
    setServerError(null);
    reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description?.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = (await safeJson(res)) as { detail?: string } | null;
        setServerError(body?.detail ?? "Could not create project.");
        return;
      }

      const project = (await res.json()) as ProjectResponse;
      setOpen(false);
      reset();
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setServerError("Network error.");
    }
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        New project
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Create a project"
        description="Each project owns a DesignerState — the pipeline you'll configure and export."
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <FormField
            label="Name"
            htmlFor="project-name"
            error={errors.name?.message}
          >
            <Input
              id="project-name"
              autoFocus
              placeholder="Support knowledge base"
              invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="project-description"
            hint="Optional. Helps your team know what this pipeline answers."
            error={errors.description?.message}
          >
            <textarea
              id="project-description"
              rows={3}
              placeholder="RAG over our help center and engineering runbooks."
              className="block w-full resize-y rounded-lg border border-border bg-bg-inset px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
              {...register("description")}
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

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
