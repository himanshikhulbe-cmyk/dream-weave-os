import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppPage,
});

function AppPage() {
  return <div className="p-8 text-muted-foreground">App — coming online…</div>;
}
