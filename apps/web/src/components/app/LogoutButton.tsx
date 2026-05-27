"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onLogout}
      loading={pending}
      leftIcon={<LogOut className="h-3.5 w-3.5" />}
    >
      Sign out
    </Button>
  );
}
