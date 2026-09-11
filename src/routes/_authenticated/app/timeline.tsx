import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  return <div className="p-8 text-muted-foreground">Timeline — coming online…</div>;
}
