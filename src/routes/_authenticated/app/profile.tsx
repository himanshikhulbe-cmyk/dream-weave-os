import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return <div className="p-8 text-muted-foreground">Profile — coming online…</div>;
}
