import type { Metadata } from "next";
import { LineChart } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";

export const metadata: Metadata = {
  title: "Evaluation",
};

export default function EvaluationPage() {
  return (
    <EmptyState
      icon={LineChart}
      title="Evaluation coming soon"
      description="Once a run is triggered from the API, scores will surface here. The /api/evaluation endpoint is already live — UI follows next."
    />
  );
}
