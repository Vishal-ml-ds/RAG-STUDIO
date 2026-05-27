"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

interface ProjectTabsProps {
  projectId: string;
}

interface Tab {
  href: string;
  label: string;
  match: (pathname: string, base: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "",
    label: "Overview",
    match: (pathname, base) => pathname === base,
  },
  {
    href: "/designer",
    label: "Designer",
    match: (pathname, base) => pathname.startsWith(`${base}/designer`),
  },
  {
    href: "/export",
    label: "Export",
    match: (pathname, base) => pathname.startsWith(`${base}/export`),
  },
  {
    href: "/evaluation",
    label: "Evaluation",
    match: (pathname, base) => pathname.startsWith(`${base}/evaluation`),
  },
];

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav
      aria-label="Project sections"
      className="-mb-px flex flex-wrap items-end gap-1 border-b border-border-subtle"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname, base);
        return (
          <Link
            key={tab.label}
            href={`${base}${tab.href}`}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
