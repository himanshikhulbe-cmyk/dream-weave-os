import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Wind, Bell, Sparkles, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { reflectionsQuery, keys } from "@/lib/vision/api";
import type { AiReflection, ReflectionKind } from "@/lib/vision/types";
import {
  generateReflection,
  generateReminders,
  generateFutureSelf,
  generatePatterns,
} from "@/lib/vision/ai.functions";

export const Route = createFileRoute("/_authenticated/app/reflect")({
  head: () => ({
    meta: [
      { title: "Reflect — Vision OS" },
      { name: "description", content: "Your universe, read back to you." },
      { property: "og:title", content: "Reflect — Vision OS" },
      { property: "og:description", content: "Your universe, read back to you." },
    ],
  }),
  component: ReflectPage,
});

const KIND_LABELS: Record<string, string> = {
  reflection: "Reflection",
  reminder: "Reminder",
  future_self: "Future Self",
  pattern: "Pattern",
};

interface Theme {
  name: string;
  strength: number;
  evidence: string[];
}

function parseThemes(meta: unknown): Theme[] {
  if (!meta || typeof meta !== "object") return [];
  const themes = (meta as { themes?: unknown }).themes;
  if (!Array.isArray(themes)) return [];
  return themes
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      name: typeof t["name"] === "string" ? t["name"] : "",
      strength: typeof t["strength"] === "number" ? t["strength"] : 0,
      evidence: Array.isArray(t["evidence"]) ? (t["evidence"].filter((e) => typeof e === "string") as string[]) : [],
    }))
    .filter((t) => t.name);
}

function ReflectPage() {
  const queryClient = useQueryClient();
  const reflections = useQuery(reflectionsQuery);

  const reflectFn = useServerFn(generateReflection);
  const remindersFn = useServerFn(generateReminders);
  const futureSelfFn = useServerFn(generateFutureSelf);
  const patternsFn = useServerFn(generatePatterns);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: keys.reflections });
    void queryClient.invalidateQueries({ queryKey: keys.notifications });
  };

  const reflectMutation = useMutation({
    mutationFn: () => reflectFn({ data: {} }),
    onSuccess: () => {
      invalidate();
      toast.success("Done");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const remindersMutation = useMutation({
    mutationFn: () => remindersFn({ data: {} }),
    onSuccess: () => {
      invalidate();
      toast.success("Done");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const futureSelfMutation = useMutation({
    mutationFn: () => futureSelfFn({ data: {} }),
    onSuccess: () => {
      invalidate();
      toast.success("Done");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const patternsMutation = useMutation({
    mutationFn: () => patternsFn({ data: {} }),
    onSuccess: () => {
      invalidate();
      toast.success("Done");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const actions = [
    {
      key: "reflection",
      icon: Wind,
      title: "Reflection",
      description: "A warm, honest look at the themes running through your dreams.",
      mutation: reflectMutation,
    },
    {
      key: "reminder",
      icon: Bell,
      title: "Reminders",
      description: "Surface what's been quiet or slipping toward a deadline.",
      mutation: remindersMutation,
    },
    {
      key: "future_self",
      icon: Sparkles,
      title: "Future Self",
      description: "A short message from who you're becoming.",
      mutation: futureSelfMutation,
    },
    {
      key: "pattern",
      icon: GitBranch,
      title: "Patterns",
      description: "Recurring threads across everything you've gathered.",
      mutation: patternsMutation,
    },
  ] as const;

  const latest = reflections.data?.[0];

  const grouped = useMemo(() => {
    const map = new Map<ReflectionKind, AiReflection[]>();
    for (const r of reflections.data ?? []) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return Array.from(map.entries());
  }, [reflections.data]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 pb-24">
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <h1 className="font-display text-4xl italic text-foreground">Reflect</h1>
        <p className="mt-2 text-sm italic-accent">Your universe, read back to you.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <GlassPanel
              key={a.key}
              lift
              className="flex flex-col gap-4 p-6 animate-fade-up"
              style={{ animationDelay: `${60 + i * 40}ms` }}
            >
              <Icon className="h-6 w-6 text-rose" strokeWidth={1.5} />
              <div>
                <h3 className="font-display text-lg text-foreground">{a.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
              </div>
              <Button
                variant="chrome"
                size="sm"
                className="mt-auto w-fit rounded-full"
                disabled={a.mutation.isPending}
                onClick={() => a.mutation.mutate()}
              >
                {a.mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  "Generate"
                )}
              </Button>
            </GlassPanel>
          );
        })}
      </div>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "260ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">Latest</h2>
        {latest ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              {KIND_LABELS[latest.kind] ?? latest.kind} ·{" "}
              {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
            </span>
            <p className="font-display text-2xl italic text-foreground/90">{latest.content}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reflections yet — generate your first one.
          </p>
        )}
      </GlassPanel>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">History</h2>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map(([kind, list]) => (
              <div key={kind} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-foreground">{KIND_LABELS[kind] ?? kind}</h3>
                <div className="flex flex-col gap-3">
                  {list.map((r) => {
                    const themes = kind === "pattern" ? parseThemes(r.meta) : [];
                    return (
                      <div key={r.id} className="glass rounded-2xl p-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{r.content}</p>
                        {themes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {themes.map((t) => (
                              <div
                                key={t.name}
                                className="flex flex-col gap-1 rounded-full glass px-3 py-1.5"
                              >
                                <span className="text-xs text-foreground/90">{t.name}</span>
                                <div className="h-1 w-16 overflow-hidden rounded-full bg-glass">
                                  <div
                                    className="h-full chrome-surface"
                                    style={{ width: `${Math.round(t.strength * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
