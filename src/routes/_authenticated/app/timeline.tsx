import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { allItemsQuery, sectionsQuery, touchItem } from "@/lib/vision/api";
import { TimelineView } from "@/components/vision/modes/TimelineView";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/timeline")({
  component: TimelinePage,
  head: () => ({
    meta: [
      { title: "Timeline — Vision OS" },
      { name: "description", content: "Your future, through time — dreams and milestones laid out across years." },
      { property: "og:title", content: "Timeline — Vision OS" },
      { property: "og:description", content: "Your future, through time." },
    ],
  }),
});

function TimelinePage() {
  const navigate = useNavigate();
  const { data: items = [] } = useQuery(allItemsQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const [sectionId, setSectionId] = useState<string | "all">("all");

  const filtered = useMemo(
    () => (sectionId === "all" ? items : items.filter((it) => it.section_id === sectionId)),
    [items, sectionId],
  );

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
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="font-display text-4xl">Timeline</h1>
        <p className="italic-accent mt-1 text-lg">Your future, through time.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSectionId("all")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs transition-colors",
            sectionId === "all" ? "bg-rose/25 text-foreground" : "glass text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSectionId(s.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs transition-colors",
              sectionId === s.id ? "bg-rose/25 text-foreground" : "glass text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <TimelineView items={filtered} onOpen={open} className="h-[calc(100vh-300px)] min-h-[480px]" />
    </div>
  );
}
