import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wand2,
  ShieldCheck,
  Boxes,
} from "lucide-react";

import { Container } from "@/components/ui/Container";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Designer",
    body: "Configure all 17 stages — from chunking to evaluation — in a single editable view. Every field is typed and versioned.",
  },
  {
    icon: Wand2,
    title: "Autopilot",
    body: "Drop in a one-paragraph brief and get a fully populated DesignerState with reasoning notes you can audit.",
  },
  {
    icon: ShieldCheck,
    title: "Guardrails",
    body: "PII detection, toxicity, bias and hallucination heuristics run on input and output — wired before you ship.",
  },
  {
    icon: Boxes,
    title: "Export",
    body: "Generate runnable Python, declarative YAML, Terraform, Docker Compose, or Kubernetes manifests in one click.",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-y border-border-subtle bg-bg-panel/40">
      <Container className="py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One studio, the whole pipeline.
          </h2>
          <p className="mt-3 text-text-secondary">
            Stop wiring retrieval, prompts, safety, eval and deployment by
            hand. Compose them as a pipeline and ship the artifact.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <li className="group relative overflow-hidden rounded-xl border border-border bg-bg-base/70 p-6 transition-colors hover:border-border-strong">
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0"
      />
      <div className="relative">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-panel text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {feature.body}
        </p>
      </div>
    </li>
  );
}
