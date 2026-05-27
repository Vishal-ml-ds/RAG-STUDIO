import type { CurrentUserResponse } from "@/lib/types";

import { LogoutButton } from "@/components/app/LogoutButton";
import { Badge } from "@/components/ui/Badge";

interface TopbarProps {
  user: CurrentUserResponse;
}

export function Topbar({ user }: TopbarProps) {
  const display = user.name?.trim() || user.email;
  const initials = display.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-bg-base/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Badge tone="accent">{user.role}</Badge>
        <span className="text-text-tertiary">Signed in as</span>
        <span className="text-text-primary">{display}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden h-8 w-8 place-items-center rounded-full border border-border bg-bg-raised text-xs font-medium text-text-primary sm:grid">
          {initials}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
