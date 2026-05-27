import type { LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}

interface StatGridProps {
  stats: Stat[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <li
            key={stat.label}
            className="rounded-xl border border-border bg-bg-panel p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-text-tertiary">
                {stat.label}
              </span>
              <Icon className="h-4 w-4 text-text-tertiary" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">
              {stat.value}
            </div>
            {stat.hint ? (
              <p className="mt-1 text-xs text-text-secondary">{stat.hint}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
