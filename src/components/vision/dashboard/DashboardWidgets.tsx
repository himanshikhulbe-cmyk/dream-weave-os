import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, isSameDay } from "date-fns";
import { Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { VisionCard } from "@/components/vision/cards/VisionCard";
import { SectionDialog } from "@/components/vision/shell/SectionDialog";
import { createSection, keys } from "@/lib/vision/api";
import { isGoal, type Section, type VisionItem } from "@/lib/vision/types";

const STARTER_SECTIONS: { name: string; icon: string; color: string }[] = [
  { name: "Career", icon: "💼", color: "oklch(0.6 0.1 260)" },
  { name: "Research", icon: "🧠", color: "oklch(0.72 0.1 180)" },
  { name: "Travel", icon: "🗺️", color: "oklch(0.85 0.05 80)" },
  { name: "Health", icon: "🌿", color: "oklch(0.75 0.12 140)" },
  { name: "Creative Projects", icon: "🎨", color: "oklch(0.72 0.09 295)" },
  { name: "Personal Growth", icon: "✨", color: "oklch(0.78 0.08 350)" },
];

export function EmptyUniverse() {
  const queryClient = useQueryClient();
  const [customOpen, setCustomOpen] = useState(false);
  const createStarter = useMutation({
    mutationFn: (s: (typeof STARTER_SECTIONS)[number]) =>
      createSection({ name: s.name, icon: s.icon, color: s.color, sort_order: 0 }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sections });
      toast.success("Section planted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center animate-fade-up">
      <h1 className="max-w-xl font-display text-4xl italic text-foreground sm:text-5xl">
        Plant your first section.
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Sections hold the pieces of your universe — goals, notes, images, voices. Start with a
        suggestion, or make your own.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {STARTER_SECTIONS.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => createStarter.mutate(s)}
            className="glass hover-lift flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-transform"
          >
            <span>{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>

      <Button variant="outline" className="mt-6 rounded-full" onClick={() => setCustomOpen(true)}>
        Custom section
      </Button>

      <SectionDialog open={customOpen} onOpenChange={setCustomOpen} />
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const w = 64;
  const h = 20;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-16 text-rose">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

export function MetricOrb({
  label,
  value,
  glow,
  sparkline,
}: {
  label: string;
  value: number;
  glow: string;
  sparkline?: number[];
}) {
  return (
    <GlassPanel className="flex min-w-[150px] flex-1 flex-col gap-2 p-5" lift>
      <div className={`h-1.5 w-8 rounded-full ${glow}`} />
      <span className="font-display text-3xl text-foreground">{value}</span>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {sparkline && <Sparkline points={sparkline} />}
      </div>
    </GlassPanel>
  );
}

export function RecentRow({ items }: { items: VisionItem[] }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {items.map((item) => (
        <VisionCard
          key={item.id}
          item={item}
          compact
          className="glass w-56 shrink-0 rounded-2xl"
          onOpen={(it) =>
            it.section_id &&
            void navigate({
              to: "/app/sections/$sectionId",
              params: { sectionId: it.section_id },
              search: { item: it.id } as never,
            })
          }
        />
      ))}
    </div>
  );
}

export function ProgressBars({ items, sections }: { items: VisionItem[]; sections: Section[] }) {
  const goals = useMemo(
    () =>
      items
        .filter((i) => isGoal(i) && (i.progress ?? 0) > 0)
        .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
        .slice(0, 6),
    [items],
  );
  if (goals.length === 0) return null;
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  return (
    <div className="flex flex-col gap-4">
      {goals.map((g) => (
        <div key={g.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{g.title ?? "Untitled goal"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {g.section_id ? sectionById.get(g.section_id)?.name : ""} · {g.progress ?? 0}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-glass">
            <div
              className="h-full rounded-full chrome-surface"
              style={{ width: `${g.progress ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForgottenCorners({ sections }: { sections: Section[] }) {
  const oldest = useMemo(
    () =>
      [...sections]
        .sort((a, b) => {
          const av = a.last_visited_at ? new Date(a.last_visited_at).getTime() : 0;
          const bv = b.last_visited_at ? new Date(b.last_visited_at).getTime() : 0;
          return av - bv;
        })
        .slice(0, 4),
    [sections],
  );
  if (oldest.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {oldest.map((s) => (
        <Link
          key={s.id}
          to="/app/sections/$sectionId"
          params={{ sectionId: s.id }}
          className="glass hover-lift flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
        >
          <span className="truncate">
            {s.icon ? `${s.icon} ` : ""}
            {s.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {s.last_visited_at
              ? `visited ${formatDistanceToNow(new Date(s.last_visited_at), { addSuffix: true })}`
              : "never visited"}
          </span>
        </Link>
      ))}
    </div>
  );
}

interface ActivityEntry {
  id: string;
  label: string;
  date: Date;
}

export function ActivityTimeline({ items, sections }: { items: VisionItem[]; sections: Section[] }) {
  const entries = useMemo<ActivityEntry[]>(() => {
    const fromItems = items.slice(0, 12).map((i) => ({
      id: `item-${i.id}`,
      label: `Added “${i.title ?? i.type}”`,
      date: new Date(i.created_at),
    }));
    const fromSections = sections.slice(0, 6).map((s) => ({
      id: `section-${s.id}`,
      label: `Created section “${s.name}”`,
      date: new Date(s.created_at),
    }));
    return [...fromItems, ...fromSections].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 14);
  }, [items, sections]);

  if (entries.length === 0) return null;

  const groups: { day: Date; entries: ActivityEntry[] }[] = [];
  for (const entry of entries) {
    const group = groups.find((g) => isSameDay(g.day, entry.date));
    if (group) group.entries.push(entry);
    else groups.push({ day: entry.date, entries: [entry] });
  }

  return (
    <div className="relative pl-5">
      <div className="absolute bottom-0 left-1.5 top-0 w-px chrome-surface" />
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.day.toISOString()}>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              {format(group.day, "EEEE, MMM d")}
            </p>
            <div className="flex flex-col gap-2.5">
              {group.entries.map((entry) => (
                <div key={entry.id} className="relative flex items-center gap-3 text-sm">
                  <span className="absolute -left-[18px] h-2 w-2 rounded-full bg-rose shadow-glow-rose" />
                  <span className="truncate text-foreground/90">{entry.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VoiceHint() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
      Voice notes are first-class dreams.
      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
    </div>
  );
}
