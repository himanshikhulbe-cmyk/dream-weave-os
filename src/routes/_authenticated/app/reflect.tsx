import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/reflect")({
  component: ReflectPage,
});

function ReflectPage() {
  return <div className="p-8 text-muted-foreground">Reflect — coming online…</div>;
}
