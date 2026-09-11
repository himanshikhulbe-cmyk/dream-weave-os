import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/universe")({
  component: UniversePage,
});

function UniversePage() {
  return <div className="p-8 text-muted-foreground">Universe — coming online…</div>;
}
