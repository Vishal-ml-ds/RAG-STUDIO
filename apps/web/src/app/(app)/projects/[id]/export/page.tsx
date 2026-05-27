import type { Metadata } from "next";

import { CodeExporter } from "@/components/export/CodeExporter";

export const metadata: Metadata = {
  title: "Export",
};

interface ExportPageProps {
  params: { id: string };
}

export default function ExportPage({ params }: ExportPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Generate pipeline artifacts
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Each tab renders the current DesignerState in a target format. Copy
          the snippet or download the file — both work without leaving the
          page.
        </p>
      </div>

      <CodeExporter projectId={params.id} />
    </div>
  );
}
