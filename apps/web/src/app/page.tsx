import { CTA } from "@/components/marketing/CTA";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Hero } from "@/components/marketing/Hero";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <CTA />
      </main>
      <footer className="border-t border-border-subtle py-8">
        <div className="mx-auto max-w-6xl px-6 text-xs text-text-tertiary sm:px-8">
          RAG Studio — Unified RAG development platform.
        </div>
      </footer>
    </div>
  );
}
