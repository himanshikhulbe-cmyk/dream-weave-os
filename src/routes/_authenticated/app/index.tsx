import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import {
  EmptyUniverse,
  MetricOrb,
  RecentRow,
  ProgressBars,
  ForgottenCorners,
  ActivityTimeline,
  VoiceHint,
} from "@/components/vision/dashboard/DashboardWidgets";
import {
  sectionsQuery,
  allItemsQuery,
  reflectionsQuery,
  notificationsQuery,
  profileQuery,
} from "@/lib/vision/api";
import { isGoal } from "@/lib/vision/types";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vision OS" },
      { name: "description", content: "Your living universe of dreams and goals, at a glance." },
      { property: "og:title", content: "Dashboard — Vision OS" },
      {
        property: "og:description",
        content: "Your living universe of dreams and goals, at a glance.",
      },
    ],
  }),
  component: AppPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const REFLECTION_LABELS: Record<string, string> = {
  reflection: "Reflection",
  reminder: "Reminder",
  future_self: "Future Self",
  pattern: "Pattern",
};

function AppPage() {
  const sections = useQuery(sectionsQuery);
  const items = useQuery(allItemsQuery);
  const reflections = useQuery(reflectionsQuery);
  const notifications = useQuery(notificationsQuery);
  const profile = useQuery(profileQuery);

  if (sections.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Waking your universe…</div>;
  }

  const sectionList = sections.data ?? [];
  if (sectionList.length === 0) return <EmptyUniverse />;

  const itemList = items.data ?? [];
  const goals = itemList.filter(isGoal);
  const completed = itemList.filter((i) => i.status === "completed");
  const audio = itemList.filter((i) => i.type === "audio");

  const now = new Date();
  const dailyCounts: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const count = itemList.filter((it) => {
      const c = new Date(it.created_at);
      return c.toDateString() === day.toDateString();
    }).length;
    dailyCounts.push(count);
  }

  const recent = itemList.slice(0, 8);
  const latestReflection = reflections.data?.[0];

  void notifications.data;

  const name = profile.data?.display_name ?? "there";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 pb-24">
      <div
        className="flex flex-col items-start justify-between gap-4 animate-fade-up sm:flex-row sm:items-end"
        style={{ animationDelay: "0ms" }}
      >
        <div>
          <h1 className="font-display text-4xl italic text-foreground sm:text-5xl">
            {greeting()}, <span className="italic-accent">{name}</span>.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here's what your universe looks like today.
          </p>
        </div>
        <Button asChild variant="chrome" className="rounded-full">
          <Link to="/app/universe" search={{ shuffle: "1" } as never}>
            Surprise Me
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <MetricOrb label="Total dreams" value={itemList.length} glow="bg-rose" sparkline={dailyCounts} />
        <MetricOrb label="Goals" value={goals.length} glow="bg-lavender" sparkline={dailyCounts} />
        <MetricOrb label="Completed" value={completed.length} glow="bg-chrome" sparkline={dailyCounts} />
        <MetricOrb label="Voice notes" value={audio.length} glow="bg-pearl" sparkline={dailyCounts} />
        <MetricOrb label="Sections" value={sectionList.length} glow="bg-rose/60" sparkline={dailyCounts} />
      </div>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          Recently added
        </h2>
        <RecentRow items={recent} />
      </GlassPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
            Goals in motion
          </h2>
          <ProgressBars items={itemList} sections={sectionList} />
        </GlassPanel>

        <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "220ms" }}>
          <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
            Latest reflection
          </h2>
          {latestReflection ? (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-muted-foreground">
                {REFLECTION_LABELS[latestReflection.kind] ?? latestReflection.kind} ·{" "}
                {formatDistanceToNow(new Date(latestReflection.created_at), { addSuffix: true })}
              </span>
              <p className="font-display text-lg italic text-foreground/90">
                {latestReflection.content}
              </p>
              <Link to="/app/reflect" className="text-xs text-muted-foreground underline underline-offset-4">
                See all reflections
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Nothing yet — ask Vision OS to reflect on your universe.
              </p>
              <Button asChild variant="glass" size="sm" className="w-fit rounded-full">
                <Link to="/app/reflect">Generate a reflection</Link>
              </Button>
            </div>
          )}
        </GlassPanel>
      </div>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "260ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          Forgotten corners
        </h2>
        <ForgottenCorners sections={sectionList} />
      </GlassPanel>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">Activity</h2>
        <ActivityTimeline items={itemList} sections={sectionList} />
      </GlassPanel>

      <div className="animate-fade-up" style={{ animationDelay: "340ms" }}>
        <VoiceHint />
      </div>
    </div>
  );
}
