import type { Database } from "@/integrations/supabase/types";

export type Section = Database["public"]["Tables"]["sections"]["Row"];
export type SectionInsert = Database["public"]["Tables"]["sections"]["Insert"];
export type SectionUpdate = Database["public"]["Tables"]["sections"]["Update"];

export type VisionItem = Database["public"]["Tables"]["vision_items"]["Row"];
export type VisionItemInsert = Database["public"]["Tables"]["vision_items"]["Insert"];
export type VisionItemUpdate = Database["public"]["Tables"]["vision_items"]["Update"];

export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Layout = Database["public"]["Tables"]["layouts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AiReflection = Database["public"]["Tables"]["ai_reflections"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type ItemType = Database["public"]["Enums"]["item_type"];
export type ItemStatus = Database["public"]["Enums"]["item_status"];
export type TextKind = Database["public"]["Enums"]["text_kind"];
export type ReflectionKind = Database["public"]["Enums"]["reflection_kind"];

export type ViewMode =
  | "static"
  | "focus"
  | "random"
  | "daily"
  | "cloud"
  | "timeline"
  | "mood";

export const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "static", label: "Static", hint: "Your arrangement, everything visible" },
  { id: "focus", label: "Focus", hint: "One section, nothing else" },
  { id: "random", label: "Random", hint: "Rediscover forgotten pieces" },
  { id: "daily", label: "Daily", hint: "Today's personalized board" },
  { id: "cloud", label: "Dream Cloud", hint: "Drift through your mind" },
  { id: "timeline", label: "Timeline", hint: "Your future through time" },
  { id: "mood", label: "Mood", hint: "Filter by feeling" },
];

export const MOODS = [
  "Motivation",
  "Confidence",
  "Discipline",
  "Adventure",
  "Creativity",
  "Learning",
  "Calm",
  "Focus",
] as const;

export const STATUSES: { id: ItemStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "planned", label: "Planned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export const TEXT_KINDS: { id: TextKind; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "goal", label: "Goal" },
  { id: "quote", label: "Quote" },
  { id: "journal", label: "Journal" },
  { id: "reflection", label: "Reflection" },
  { id: "manifestation", label: "Manifestation" },
  { id: "idea", label: "Idea" },
  { id: "plan", label: "Plan" },
];

export const ITEM_TYPES: { id: ItemType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Voice" },
  { id: "document", label: "Document" },
];

export const SECTION_COLORS = [
  "oklch(0.78 0.08 350)",
  "oklch(0.72 0.09 295)",
  "oklch(0.86 0.012 300)",
  "oklch(0.6 0.1 260)",
  "oklch(0.85 0.05 80)",
  "oklch(0.72 0.1 180)",
  "oklch(0.75 0.12 140)",
  "oklch(0.7 0.14 30)",
];

export const PRIORITY_LABELS = ["None", "Low", "Medium", "High"] as const;

export function isGoal(item: VisionItem) {
  return item.type === "text" && item.text_kind === "goal";
}

/** Simple seeded PRNG for deterministic "daily" boards. */
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function shuffleWith<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const ai = a[i] as T;
    a[i] = a[j] as T;
    a[j] = ai;
  }
  return a;
}
