import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-hero opacity-100"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />

      <Container className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-bg-panel/80 px-3 py-1 text-xs font-medium text-text-secondary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Designer + Autopilot for production RAG</span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient-accent">Ship grounded LLM apps</span>
            <br />
            <span className="text-text-primary">without rebuilding the stack.</span>
          </h1>

          <p className="mt-6 text-balance text-base text-text-secondary sm:text-lg">
            RAG Studio gives you a visual designer for the 17-stage retrieval
            pipeline, an autopilot that turns a brief into a deployable spec,
            and exports to Python, Terraform, Docker Compose, or Kubernetes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open Studio
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create account
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-text-tertiary">
            Self-hosted. JWT auth. Dark-by-default.
          </p>
        </div>
      </Container>
    </section>
  );
}
