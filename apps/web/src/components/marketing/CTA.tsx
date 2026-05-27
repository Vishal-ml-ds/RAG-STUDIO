import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CTA() {
  return (
    <section>
      <Container className="py-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-panel px-8 py-14 text-center sm:px-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-hero opacity-90"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Design once. <span className="text-gradient-accent">Deploy anywhere.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Sign in to open the Studio. Bootstrap users are seeded in dev so
              you can be in the designer in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Sign in to Studio
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="ghost">
                  Or create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
