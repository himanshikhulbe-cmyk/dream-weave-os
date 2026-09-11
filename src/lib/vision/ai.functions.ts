import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

type SupabaseCtx = { supabase: any; userId: string };

async function loadContext(ctx: SupabaseCtx) {
  const { data: sections } = await ctx.supabase
    .from("sections")
    .select("id, name, last_visited_at")
    .order("created_at", { ascending: true });

  const { data: items } = await ctx.supabase
    .from("vision_items")
    .select(
      "title, type, text_kind, tags, moods, status, progress, deadline, target_year, body, created_at, last_viewed_at, section_id",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const cleanedItems = (items ?? []).map((it: any) => ({
    title: it.title as string | null,
    type: it.type as string,
    text_kind: it.text_kind as string | null,
    tags: (it.tags ?? []) as string[],
    moods: (it.moods ?? []) as string[],
    status: it.status as string,
    progress: it.progress as number,
    deadline: it.deadline as string | null,
    target_year: it.target_year as number | null,
    created_at: it.created_at as string,
    last_viewed_at: it.last_viewed_at as string | null,
    section_id: it.section_id as string | null,
    body: stripHtml(it.body as string | null),
  }));

  return { sections: (sections ?? []) as { id: string; name: string; last_visited_at: string | null }[], items: cleanedItems };
}

async function callGateway(messages: { role: string; content: string }[], jsonMode?: boolean) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this environment.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("Rate limited, try again shortly");
  if (res.status === 402) throw new Error("AI credits exhausted");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return content;
}

/* ------------------------------------------------------------------ */
/* generateReflection                                                  */
/* ------------------------------------------------------------------ */

export const generateReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).optional())
  .handler(async ({ context }) => {
    const { sections, items } = await loadContext(context);
    const summary = items
      .slice(0, 80)
      .map((it) => `- [${it.type}${it.text_kind ? `/${it.text_kind}` : ""}] ${it.title ?? ""} ${it.tags.join(", ")} ${it.body}`.trim())
      .join("\n");

    const content = await callGateway([
      {
        role: "system",
        content:
          "You are a calm, insightful guide reflecting on someone's personal vision board (Vision OS). Write warmly, in second person, 3-5 short sentences about recurring themes across their dreams, goals and notes. Be specific, not generic. Example tone: 'You consistently focus on learning and research.'",
      },
      {
        role: "user",
        content: `Sections: ${sections.map((s) => s.name).join(", ") || "none"}.\n\nItems:\n${summary || "No items yet."}`,
      },
    ]);

    const { error } = await context.supabase.from("ai_reflections").insert({
      user_id: context.userId,
      kind: "reflection",
      content,
      meta: {},
    });
    if (error) throw error;

    return { content };
  });

/* ------------------------------------------------------------------ */
/* generateReminders (computed, not AI)                                */
/* ------------------------------------------------------------------ */

export const generateReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).optional())
  .handler(async ({ context }) => {
    const { sections, items } = await loadContext(context);
    const now = Date.now();
    const DAY = 1000 * 60 * 60 * 24;
    const reminders: string[] = [];

    for (const s of sections) {
      if (!s.last_visited_at) continue;
      const days = Math.floor((now - new Date(s.last_visited_at).getTime()) / DAY);
      if (days > 14) {
        reminders.push(`You haven't visited your ${s.name} section in ${days} days.`);
      }
    }

    for (const it of items) {
      if (it.text_kind === "goal" && it.status !== "completed" && it.status !== "archived") {
        const lastTouch = it.last_viewed_at ?? it.created_at;
        const days = Math.floor((now - new Date(lastTouch).getTime()) / DAY);
        if (it.progress === 0 && days > 21) {
          reminders.push(`"${it.title ?? "A goal"}" hasn't moved in ${days} days — a small step could restart momentum.`);
        }
      }
      if (it.deadline) {
        const daysLeft = Math.floor((new Date(it.deadline).getTime() - now) / DAY);
        if (daysLeft >= 0 && daysLeft <= 14) {
          reminders.push(`"${it.title ?? "A dream"}" is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`);
        }
      }
    }

    const unique = Array.from(new Set(reminders)).slice(0, 8);

    if (unique.length) {
      const { data: existingUnread } = await context.supabase
        .from("notifications")
        .select("title")
        .eq("read", false);
      const existingTitles = new Set((existingUnread ?? []).map((n: any) => n.title as string));

      const toInsert = unique
        .filter((title) => !existingTitles.has(title))
        .map((title) => ({ user_id: context.userId, title, body: null, kind: "reminder" }));

      if (toInsert.length) {
        const { error: nErr } = await context.supabase.from("notifications").insert(toInsert);
        if (nErr) throw nErr;
      }
    }

    const content = unique.length ? unique.join("\n") : "Nothing urgent — your universe is calm right now.";
    const { error } = await context.supabase.from("ai_reflections").insert({
      user_id: context.userId,
      kind: "reminder",
      content,
      meta: { reminders: unique },
    });
    if (error) throw error;

    return { reminders: unique };
  });

/* ------------------------------------------------------------------ */
/* generateFutureSelf                                                  */
/* ------------------------------------------------------------------ */

export const generateFutureSelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).optional())
  .handler(async ({ context }) => {
    const { items } = await loadContext(context);
    const goals = items.filter((it) => it.text_kind === "goal");
    const goalList = goals.slice(0, 20).map((g) => `${g.title ?? "a goal"} (${g.status}, ${g.progress}%)`).join("; ");

    const content = await callGateway([
      {
        role: "system",
        content:
          "You are the user's future self, writing one short, encouraging 1-2 sentence message about the goals they're working toward today. Warm, specific, never generic. Example: 'The effort you're investing today is shaping opportunities you haven't even imagined yet.'",
      },
      {
        role: "user",
        content: goalList ? `My current goals: ${goalList}` : "I haven't set explicit goals yet, but I'm building my vision.",
      },
    ]);

    const { error } = await context.supabase.from("ai_reflections").insert({
      user_id: context.userId,
      kind: "future_self",
      content,
      meta: {},
    });
    if (error) throw error;

    return { content };
  });

/* ------------------------------------------------------------------ */
/* generatePatterns                                                    */
/* ------------------------------------------------------------------ */

const patternsSchema = z.object({
  themes: z
    .array(
      z.object({
        name: z.string(),
        strength: z.number().min(0).max(1),
        evidence: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  momentum: z.string().default(""),
  suggestion: z.string().default(""),
});

export type PatternsResult = z.infer<typeof patternsSchema>;

export const generatePatterns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).optional())
  .handler(async ({ context }) => {
    const { items } = await loadContext(context);
    const summary = items
      .slice(0, 100)
      .map((it) => `- [${it.type}${it.text_kind ? `/${it.text_kind}` : ""}] ${it.title ?? ""} tags:${it.tags.join(",")} moods:${it.moods.join(",")}`)
      .join("\n");

    const raw = await callGateway(
      [
        {
          role: "system",
          content:
            'You analyze a personal vision board and respond ONLY with strict JSON matching this shape: {"themes":[{"name":string,"strength":number between 0 and 1,"evidence":string[]}],"momentum":string,"suggestion":string}. Identify 3-6 recurring themes, one momentum sentence, and one gentle suggestion.',
        },
        { role: "user", content: summary || "No items yet." },
      ],
      true,
    );

    let parsed: PatternsResult;
    try {
      const json = JSON.parse(raw) as unknown;
      parsed = patternsSchema.parse(json);
    } catch {
      parsed = { themes: [], momentum: "Not enough signal yet.", suggestion: "Add a few more dreams to see patterns emerge." };
    }

    const contentSummary =
      parsed.themes.length > 0
        ? `Themes: ${parsed.themes.map((t) => t.name).join(", ")}. ${parsed.momentum}`
        : parsed.momentum || "Not enough signal yet.";

    const { error } = await context.supabase.from("ai_reflections").insert({
      user_id: context.userId,
      kind: "pattern",
      content: contentSummary,
      meta: parsed as unknown as Record<string, unknown>,
    });
    if (error) throw error;

    return parsed;
  });
