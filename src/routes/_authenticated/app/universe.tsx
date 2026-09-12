import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { Shuffle } from "lucide-react";
import { allItemsQuery, sectionsQuery, connectionsQuery, touchItem } from "@/lib/vision/api";
import { DreamCloud } from "@/components/vision/modes/DreamCloud";
import { VisionCard } from "@/components/vision/cards/VisionCard";
import { Button } from "@/components/ui/button";
import { MOODS, seededRandom, shuffleWith, todaySeed } from "@/lib/vision/types";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

const universeSearchSchema = z.object({
  shuffle: z.string().optional(),
  mode: z.enum(["cloud", "random", "daily", "mood"]).optional(),
});

export const Route = createFileRoute("/_authenticated/app/universe")({
  component: UniversePage,
  validateSearch: universeSearchSchema,
  head: () => ({
    meta: [
      { title: "Universe — Vision OS" },
      { name: "description", content: "Drift through every dream — cloud, random, daily and mood views of your universe." },
      { property: "og:title", content: "Universe — Vision OS" },
      { property: "og:description", content: "Drift through every dream in your living universe." },
    ],
  }),
});

const MODES: { id: "cloud" | "random" | "daily" | "mood"; label: string }[] = [
  { id: "cloud", label: "Dream Cloud" },
  { id: "random", label: "Random" },
  { id: "daily", label: "Daily" },
  { id: "mood", label: "Mood" },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function UniversePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: items = [] } = useQuery(allItemsQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: connections = [] } = useQuery(connectionsQuery);

  const mode = search.mode ?? "cloud";
  const [seed, setSeed] = useState(() => Date.now());
  const [sectionId, setSectionId] = useState<string | "all">("all");
  const [moods, setMoods] = useState<string[]>([]);
  const [randomLimit, setRandomLimit] = useState(24);

  useEffect(() => {
    if (search.shuffle) setSeed(Date.now());
  }, [search.shuffle]);

  function setMode(m: "cloud" | "random" | "daily" | "mood") {
    navigate({ to: "/app/universe", search: { ...search, mode: m }, replace: true });
  }

  function open(item: VisionItem) {
    if (!item.section_id) return;
    void touchItem(item.id);
    navigate({
      to: "/app/sections/$sectionId",
      params: { sectionId: item.section_id },
      search: { item: item.id } as never,
    });
  }

  const bySection = useMemo(
    () => (sectionId === "all" ? items : items.filter((it) => it.section_id === sectionId)),
    [items, sectionId],
  );

  const moodFiltered = useMemo(() => {
    if (moods.length === 0) return bySection;
    return bySection.filter((it) => it.moods.some((m) => moods.includes(m)));
  }, [bySection, moods]);

  const randomShuffled = useMemo(() => {
    const rand = seededRandom(seed || 1);
    return shuffleWith(bySection, rand);
  }, [bySection, seed]);

  const dailyShuffled = useMemo(() => {
    const rand = seededRandom(todaySeed());
    return shuffleWith(bySection, rand);
  }, [bySection]);

  const manifestation = useMemo(() => {
    const rand = seededRandom(todaySeed() + 7);
    const candidates = shuffleWith(
      bySection.filter((it) => it.type === "text" && (it.text_kind === "manifestation" || it.text_kind === "quote") && it.body),
      rand,
    );
    return candidates[0] ?? null;
  }, [bySection]);

  const total = items.length;
  const sectionCount = sections.length;

  if (total === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl">Your universe is waiting.</h1>
        <Button variant="chrome" asChild>
          <Link to="/app">Return to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Your universe</h1>
          <p className="italic-accent mt-1 text-lg">
            {total} dream{total === 1 ? "" : "s"} across {sectionCount} section{sectionCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="chrome" onClick={() => setSeed(Date.now())}>
          <Shuffle className="h-4 w-4" strokeWidth={1.5} />
          Vision Shuffle
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-full glass p-1 w-fit">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              mode === m.id ? "bg-glass-strong text-foreground shadow-glass" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
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

      {mode === "mood" && (
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs transition-colors",
                moods.includes(m) ? "bg-lavender/30 text-foreground" : "glass text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {mode === "cloud" && (
        <DreamCloud
          items={moodFiltered}
          connections={connections}
          seed={seed}
          onOpen={open}
          className="h-[calc(100vh-260px)] min-h-[520px]"
        />
      )}

      {mode === "random" && (
        <div>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {randomShuffled.slice(0, randomLimit).map((item, i) => (
              <div
                key={item.id}
                className="mb-4 break-inside-avoid animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
              >
                <VisionCard item={item} compact onOpen={open} />
              </div>
            ))}
          </div>
          {randomShuffled.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">Nothing here yet.</p>
          )}
          {randomLimit < randomShuffled.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" onClick={() => setRandomLimit((n) => n + 24)}>
                Show more
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === "daily" && (
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-2xl italic">Today&rsquo;s board — {format(new Date(), "EEEE, MMMM d")}</h2>
          {manifestation && (
            <p className="font-display text-xl italic-accent">
              {stripHtml(manifestation.body ?? "")}
            </p>
          )}
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {dailyShuffled.slice(0, 24).map((item, i) => (
              <div
                key={item.id}
                className={cn("mb-4 break-inside-avoid animate-fade-up", i === 0 && "sm:col-span-2")}
                style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
              >
                <VisionCard item={item} compact={i !== 0} onOpen={open} />
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "mood" && (
        <div>
          {moodFiltered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No dreams carry this feeling yet.</p>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {moodFiltered.slice(0, randomLimit).map((item, i) => (
                <div
                  key={item.id}
                  className="mb-4 break-inside-avoid animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
                >
                  <VisionCard item={item} compact onOpen={open} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
