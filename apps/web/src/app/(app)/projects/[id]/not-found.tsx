import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function ProjectNotFound() {
  return (
    <div className="px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Project not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        It may have been deleted or you don&apos;t have access.
      </p>
      <Link href="/projects" className="mt-6 inline-block">
        <Button variant="secondary">Back to projects</Button>
      </Link>
    </div>
  );
}
