import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/graph")({
  component: GraphPage,
});

function GraphPage() {
  return <div className="p-8 text-muted-foreground">Graph — coming online…</div>;
}
