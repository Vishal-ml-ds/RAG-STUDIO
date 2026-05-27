"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  LayoutTemplate,
  Wand2,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    match: (p) => p.startsWith("/projects"),
  },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/autopilot", label: "Autopilot", icon: Wand2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-bg-panel/40 lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-border-subtle px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">
            R
          </span>
          <span>RAG Studio</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match
            ? item.match(pathname)
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-bg-raised text-text-primary"
                  : "text-text-secondary hover:bg-bg-raised hover:text-text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-4 text-xs text-text-tertiary">
        Self-hosted RAG Studio
      </div>
    </aside>
  );
}
