import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/sections/$sectionId")({
  component: SectionBoardPage,
});

function SectionBoardPage() {
  const { sectionId } = Route.useParams();
  return <div className="p-8 text-muted-foreground">Board {sectionId} — coming online…</div>;
}
