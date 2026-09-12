import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { allItemsQuery, sectionsQuery, connectionsQuery, touchItem } from "@/lib/vision/api";
import { RelationGraph } from "@/components/vision/modes/RelationGraph";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import type { VisionItem } from "@/lib/vision/types";

export const Route = createFileRoute("/_authenticated/app/graph")({
  component: GraphPage,
  head: () => ({
    meta: [
      { title: "Relationships — Vision OS" },
      { name: "description", content: "See how your dreams, sections and goals connect in a living graph." },
      { property: "og:title", content: "Relationships — Vision OS" },
      { property: "og:description", content: "A living graph of every dream and how they connect." },
    ],
  }),
});

function GraphPage() {
  const navigate = useNavigate();
  const { data: items = [] } = useQuery(allItemsQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: connections = [] } = useQuery(connectionsQuery);

  function open(item: VisionItem) {
    if (!item.section_id) return;
    void touchItem(item.id);
    navigate({
      to: "/app/sections/$sectionId",
      params: { sectionId: item.section_id },
      search: { item: item.id } as never,
    });
  }

  return (
    <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="font-display text-4xl">Relationships</h1>
        <p className="italic-accent mt-1 text-lg">
          {connections.length} connection{connections.length === 1 ? "" : "s"} between your dreams
        </p>
      </div>
      <GlassPanel className="h-[calc(100vh-200px)] p-2">
        <RelationGraph items={items} connections={connections} sections={sections} onOpen={open} className="h-full" />
      </GlassPanel>
    </div>
  );
}
