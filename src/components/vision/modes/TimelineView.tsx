import { useMemo, useRef, useState } from "react";
import type { VisionItem } from "@/lib/vision/types";
import { isGoal } from "@/lib/vision/types";
import { MediaImage } from "@/components/vision/cards/MediaImage";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Mic, FileText, Play, File } from "lucide-react";

export interface TimelineViewProps {
  items: VisionItem[];
  onOpen?: ((item: VisionItem) => void) | undefined;
  className?: string | undefined;
}

type Filter = "all" | "goals" | "memories" | "milestones";

function anchorDate(item: VisionItem): Date {
  if (item.deadline) return new Date(item.deadline);
  if (item.target_year) return new Date(item.target_year, 0, 1);
  return new Date(item.created_at);
}

function glyph(item: VisionItem) {
  switch (item.type) {
    case "image":
      return <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case "video":
      return <Play className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case "audio":
      return <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case "document":
      return <File className="h-3.5 w-3.5" strokeWidth={1.5} />;
    default:
      return <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />;
  }
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "goals", label: "Goals" },
  { id: "memories", label: "Memories" },
  { id: "milestones", label: "Milestones" },
];

export function TimelineView({ items, onOpen, className }: TimelineViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [density, setDensity] = useState<"year" | "month">("year");
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter === "goals") return isGoal(it);
      if (filter === "memories") return !it.deadline && !it.target_year;
      if (filter === "milestones") return it.status === "completed";
      return true;
    });
  }, [items, filter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => anchorDate(a).getTime() - anchorDate(b).getTime()),
    [filtered],
  );

  const groups = useMemo(() => {
    const map = new Map<number, VisionItem[]>();
    for (const it of sorted) {
      const y = anchorDate(it).getFullYear();
      const arr = map.get(y) ?? [];
      arr.push(it);
      map.set(y, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [sorted]);

  const now = useMemo(() => new Date(), []);

  if (items.length === 0) {
    return (
      <div className={cn("flex h-full min-h-[420px] w-full items-center justify-center rounded-3xl aurora-bg", className)}>
        <p className="max-w-sm px-6 text-center font-display text-xl italic text-muted-foreground">
          Time hasn&rsquo;t begun to hold your dreams yet. Add a few to see your path unfold.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-[420px] w-full flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs transition-colors",
                filter === f.id ? "bg-rose/25 text-foreground" : "glass text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full glass p-1">
          {(["year", "month"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              className={cn(
                "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                density === d ? "bg-glass-strong text-foreground" : "text-muted-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!trackRef.current) return;
          if (e.key === "ArrowRight") trackRef.current.scrollBy({ left: 240, behavior: "smooth" });
          if (e.key === "ArrowLeft") trackRef.current.scrollBy({ left: -240, behavior: "smooth" });
        }}
        className="relative flex-1 overflow-x-auto overflow-y-hidden rounded-3xl aurora-bg px-10 py-6 outline-none"
      >
        <div className="relative flex h-full min-w-max items-center gap-14">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-chrome/50 to-transparent shadow-glow-lavender" />
          {groups.map(([year, yearItems]) => (
            <div key={year} className="relative flex items-center gap-10">
              <span className="font-display text-4xl italic text-foreground/80">{year}</span>
              {yearItems.map((item, idx) => {
                const above = idx % 2 === 0;
                const dateIsNow =
                  anchorDate(item).getFullYear() === now.getFullYear() &&
                  anchorDate(item).getMonth() === now.getMonth();
                return (
                  <div key={item.id} className="relative flex w-40 flex-col items-center">
                    <div
                      className={cn(
                        "absolute left-1/2 w-px -translate-x-1/2 bg-glass-border",
                        above ? "bottom-1/2 h-14" : "top-1/2 h-14",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => onOpen?.(item)}
                      className={cn(
                        "hover-lift w-40 rounded-2xl glass p-3 text-left shadow-glass",
                        above ? "-translate-y-20" : "translate-y-20",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between text-muted-foreground">
                        {glyph(item)}
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            dateIsNow ? "bg-rose shadow-glow-rose" : "bg-chrome/50",
                          )}
                        />
                      </div>
                      {item.type === "image" && item.media_path && (
                        <MediaImage
                          path={item.media_path}
                          alt={item.title ?? "Dream"}
                          className="mb-2 h-16 w-full rounded-lg object-cover"
                        />
                      )}
                      <p className="truncate font-display text-sm italic text-foreground">
                        {item.title ?? item.type}
                      </p>
                      {isGoal(item) && (
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-glass-strong">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose to-lavender"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
