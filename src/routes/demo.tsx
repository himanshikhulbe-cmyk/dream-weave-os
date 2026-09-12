import { useState } from "react";
import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";
import { LandingNav } from "@/components/vision/landing/LandingNav";
import { DreamCloud } from "@/components/vision/modes/DreamCloud";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import type { Connection, VisionItem } from "@/lib/vision/types";
import heroChromeLily from "@/assets/hero-chrome-lily.jpg";
import chromeCalla from "@/assets/chrome-calla.jpg";
import dreamCloudImg from "@/assets/dream-cloud.jpg";
import chromeTexture from "@/assets/chrome-texture.jpg";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Vision OS Demo — Drift through a living universe" },
      {
        name: "description",
        content: "A glimpse of a living universe of dreams — drift through a sample Dream Cloud, no sign-up required.",
      },
      { property: "og:title", content: "Vision OS Demo — Drift through a living universe" },
      {
        property: "og:description",
        content: "A glimpse of a living universe of dreams — drift through a sample Dream Cloud, no sign-up required.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

const now = new Date().toISOString();

function textItem(
  id: string,
  overrides: Partial<VisionItem> & Pick<VisionItem, "title" | "body" | "text_kind">,
): VisionItem {
  return {
    id,
    user_id: "demo",
    section_id: "demo-section",
    type: "text",
    caption: null,
    color: null,
    created_at: now,
    updated_at: now,
    deadline: null,
    duration_seconds: null,
    embed_url: null,
    file_size: null,
    group_id: null,
    h: 220,
    w: 220,
    last_viewed_at: null,
    locked: false,
    media_path: null,
    mime_type: null,
    moods: overrides.moods ?? [],
    notes: null,
    pinned: overrides.pinned ?? false,
    priority: overrides.priority ?? 0,
    progress: overrides.progress ?? 0,
    rotation: 0,
    status: overrides.status ?? "idea",
    tags: overrides.tags ?? [],
    target_year: overrides.target_year ?? null,
    thumbnail_path: null,
    transcript: null,
    x: 0,
    y: 0,
    z_index: 0,
    ...overrides,
  } as VisionItem;
}

function mediaItem(
  id: string,
  type: VisionItem["type"],
  title: string,
  overrides: Partial<VisionItem> = {},
): VisionItem {
  return {
    id,
    user_id: "demo",
    section_id: "demo-section",
    type,
    title,
    body: null,
    text_kind: null,
    caption: null,
    color: null,
    created_at: now,
    updated_at: now,
    deadline: null,
    duration_seconds: type === "audio" || type === "video" ? 96 : null,
    embed_url: null,
    file_size: null,
    group_id: null,
    h: 220,
    w: 220,
    last_viewed_at: null,
    locked: false,
    media_path: null,
    mime_type: null,
    moods: [],
    notes: null,
    pinned: false,
    priority: 0,
    progress: 0,
    rotation: 0,
    status: "idea",
    tags: [],
    target_year: null,
    thumbnail_path: null,
    transcript: null,
    x: 0,
    y: 0,
    z_index: 0,
    ...overrides,
  } as VisionItem;
}

const DEMO_ITEMS: VisionItem[] = [
  textItem("demo-1", {
    title: "Publish my first research paper",
    body: "<p>Submit to a peer-reviewed journal by autumn.</p>",
    text_kind: "goal",
    progress: 40,
    priority: 2,
    tags: ["research", "career"],
    moods: ["Discipline", "Focus"],
  }),
  textItem("demo-2", {
    title: "Quote",
    body: "<p>The future belongs to those who believe in the beauty of their dreams.</p>",
    text_kind: "quote",
    moods: ["Motivation"],
  }),
  textItem("demo-3", {
    title: "Manifestation",
    body: "<p>I am building a life that feels like freedom.</p>",
    text_kind: "manifestation",
    pinned: true,
    moods: ["Confidence"],
  }),
  textItem("demo-4", {
    title: "Morning pages",
    body: "<p>Woke up early, watched the light change over the city. Grateful.</p>",
    text_kind: "journal",
    moods: ["Calm"],
  }),
  textItem("demo-5", {
    title: "Run a marathon",
    body: "<p>Train consistently, finish under 4 hours.</p>",
    text_kind: "goal",
    progress: 65,
    target_year: 2025,
    tags: ["health"],
    moods: ["Discipline", "Adventure"],
  }),
  textItem("demo-6", {
    title: "Learn Japanese",
    body: "<p>Reach conversational fluency.</p>",
    text_kind: "plan",
    progress: 20,
    moods: ["Learning"],
  }),
  textItem("demo-7", {
    title: "Idea",
    body: "<p>A community studio where artists trade skills instead of money.</p>",
    text_kind: "idea",
    moods: ["Creativity"],
  }),
  textItem("demo-8", {
    title: "Quote",
    body: "<p>Discipline is choosing between what you want now and what you want most.</p>",
    text_kind: "quote",
    moods: ["Discipline"],
  }),
  textItem("demo-9", {
    title: "Note to self",
    body: "<p>Slow down. Nothing worth building happens overnight.</p>",
    text_kind: "note",
    moods: ["Calm"],
  }),
  textItem("demo-10", {
    title: "Launch a small studio",
    body: "<p>Register the business and ship the first project.</p>",
    text_kind: "goal",
    progress: 10,
    priority: 3,
    pinned: true,
    tags: ["business"],
    moods: ["Confidence", "Adventure"],
  }),
  mediaItem("demo-11", "image", "Chrome lily, morning light"),
  mediaItem("demo-12", "image", "Calla in chrome"),
  mediaItem("demo-13", "image", "The dream cloud"),
  mediaItem("demo-14", "image", "Liquid chrome texture"),
  mediaItem("demo-15", "audio", "Morning voice note"),
  mediaItem("demo-16", "video", "A walk through the old city"),
  mediaItem("demo-17", "document", "Five year plan.pdf"),
  textItem("demo-18", {
    title: "Reflection",
    body: "<p>What would this look like if it were easy?</p>",
    text_kind: "reflection",
    moods: ["Focus"],
  }),
];

const DEMO_CONNECTIONS: Connection[] = [
  { id: "demo-c1", user_id: "demo", from_item_id: "demo-1", to_item_id: "demo-10", label: "career", created_at: now },
  { id: "demo-c2", user_id: "demo", from_item_id: "demo-3", to_item_id: "demo-10", label: null, created_at: now },
  { id: "demo-c3", user_id: "demo", from_item_id: "demo-5", to_item_id: "demo-9", label: "discipline", created_at: now },
];

const IMAGE_MAP: Record<string, string> = {
  "demo-11": heroChromeLily,
  "demo-12": chromeCalla,
  "demo-13": dreamCloudImg,
  "demo-14": chromeTexture,
};

function resolveImage(item: VisionItem) {
  return IMAGE_MAP[item.id] ?? null;
}

function onOpenDemo() {
  toast("Sign up to open your own dreams");
}

function DemoDreamCloud({ seed }: { seed: number }) {
  return (
    <DreamCloud
      items={DEMO_ITEMS}
      connections={DEMO_CONNECTIONS}
      resolveImage={resolveImage}
      seed={seed}
      onOpen={onOpenDemo}
      className="h-[70vh] min-h-[480px]"
    />
  );
}

function DemoPage() {
  const [seed, setSeed] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <AmbientBackground />
      <LandingNav />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pt-32 text-center">
        <h1 className="font-display text-4xl md:text-5xl">A glimpse of a living universe</h1>
        <p className="italic-accent text-lg">Drift, shuffle, and open dreams that aren&rsquo;t even yours yet.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="chrome" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Start your own
            </Link>
          </Button>
          <Button variant="glass" onClick={() => setSeed((s) => s + 1)}>
            <Shuffle className="h-4 w-4" strokeWidth={1.5} />
            Shuffle
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <GlassPanel className="overflow-hidden p-2">
          <ClientOnly fallback={<div className="flex h-[70vh] min-h-[480px] items-center justify-center text-muted-foreground">Loading the universe…</div>}>
            <DemoDreamCloud seed={seed} />
          </ClientOnly>
        </GlassPanel>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">
        <GlassPanel lift className="p-6">
          <h3 className="font-display text-xl">Modes for every mood</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cloud, random, daily and timeline views keep your dreams alive instead of static.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-4 inline-block text-sm italic-accent">
            Explore modes →
          </Link>
        </GlassPanel>
        <GlassPanel lift className="p-6">
          <h3 className="font-display text-xl">Sections that grow with you</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Organize dreams, goals and memories into living sections you can revisit anytime.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-4 inline-block text-sm italic-accent">
            Build your sections →
          </Link>
        </GlassPanel>
        <GlassPanel lift className="p-6">
          <h3 className="font-display text-xl">Speak it into being</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture a voice note and let it drift among your other dreams.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-4 inline-block text-sm italic-accent">
            Try voice capture →
          </Link>
        </GlassPanel>
      </div>
    </div>
  );
}
