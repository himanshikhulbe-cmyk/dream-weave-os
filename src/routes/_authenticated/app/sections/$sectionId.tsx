import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Type,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Shuffle,
  Pencil,
  X,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChromeLoader } from "@/components/vision/ui/ChromeLoader";
import { BoardCanvas } from "@/components/vision/board/BoardCanvas";
import { CreateItemDialog } from "@/components/vision/board/create/CreateItemDialog";
import { VoiceRecorder } from "@/components/vision/board/VoiceRecorder";
import { ItemDrawer } from "@/components/vision/board/ItemDrawer";
import { LayoutsMenu } from "@/components/vision/board/LayoutsMenu";
import { SectionDialog } from "@/components/vision/shell/SectionDialog";
import { VisionCard } from "@/components/vision/cards/VisionCard";
import { DreamCloud } from "@/components/vision/modes/DreamCloud";
import { TimelineView } from "@/components/vision/modes/TimelineView";
import {
  allItemsQuery,
  connectionsQuery,
  keys,
  sectionItemsQuery,
  sectionsQuery,
  touchSection,
  updateItemPositions,
} from "@/lib/vision/api";
import {
  MOODS,
  VIEW_MODES,
  seededRandom,
  shuffleWith,
  todaySeed,
  type ItemType,
  type ViewMode,
  type VisionItem,
} from "@/lib/vision/types";
import { cn } from "@/lib/utils";

const MODE_IDS = VIEW_MODES.map((m) => m.id);

interface BoardSearch {
  item?: string | undefined;
  mode?: ViewMode | undefined;
}

export const Route = createFileRoute("/_authenticated/app/sections/$sectionId")({
  validateSearch: (search: Record<string, unknown>): BoardSearch => {
    const out: BoardSearch = {};
    if (typeof search["item"] === "string") out.item = search["item"];
    if (MODE_IDS.includes(search["mode"] as ViewMode)) out.mode = search["mode"] as ViewMode;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Section board — Vision OS" },
      { name: "description", content: "Arrange, shuffle and grow the dreams inside this section." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SectionBoardPage,
});

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function SectionBoardPage() {
  const { sectionId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading: sectionsLoading } = useQuery(sectionsQuery);
  const { data: items = [], isLoading: itemsLoading } = useQuery(sectionItemsQuery(sectionId));
  const { data: allItems = [] } = useQuery(allItemsQuery);
  const { data: connections = [] } = useQuery(connectionsQuery);

  const section = sections.find((s) => s.id === sectionId);
  const children = sections.filter((s) => s.parent_id === sectionId && !s.archived);

  const mode: ViewMode = search.mode ?? "static";
  const setMode = (m: ViewMode) =>
    void navigate({ search: (prev) => ({ ...prev, mode: m === "static" ? undefined : m }), replace: true });

  const [createType, setCreateType] = useState<ItemType | null>(null);
  const [recording, setRecording] = useState(false);
  const [editSection, setEditSection] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);

  useEffect(() => {
    void touchSection(sectionId).then(() =>
      queryClient.invalidateQueries({ queryKey: keys.sections }),
    );
  }, [sectionId, queryClient]);

  // Random mode gets a fresh seed every time it is entered (browser only).
  useEffect(() => {
    if (mode === "random") setRandomSeed(Math.floor(Math.random() * 1e9));
  }, [mode]);

  const openItem = (it: VisionItem) =>
    void navigate({ search: (prev) => ({ ...prev, item: it.id }) });
  const closeItem = () => void navigate({ search: (prev) => ({ ...prev, item: undefined }), replace: true });

  const activeItem = useMemo(
    () => (search.item ? (items.find((i) => i.id === search.item) ?? allItems.find((i) => i.id === search.item) ?? null) : null),
    [search.item, items, allItems],
  );

  const arranged = useMemo(() => {
    if (mode === "random") return shuffleWith(items, seededRandom(randomSeed || 1));
    if (mode === "daily") return shuffleWith(items, seededRandom(todaySeed() + hashId(sectionId)));
    if (mode === "mood") return moodFilter ? items.filter((i) => (i.moods ?? []).includes(moodFilter)) : items;
    return items;
  }, [mode, items, randomSeed, moodFilter, sectionId]);

  const nextZ = items.reduce((m, i) => Math.max(m, i.z_index), 0) + 1;

  /** Vision Shuffle: scatter unlocked cards into a fresh arrangement on the canvas. */
  const visionShuffle = async () => {
    if (mode === "random") {
      setRandomSeed(Math.floor(Math.random() * 1e9));
      return;
    }
    const movable = items.filter((i) => !i.locked && !i.pinned);
    if (movable.length === 0) return;
    const cols = Math.max(2, Math.ceil(Math.sqrt(movable.length * 1.4)));
    const order = shuffleWith(movable, Math.random);
    const updates = order.map((it, idx) => ({
      id: it.id,
      x: 80 + (idx % cols) * 300 + Math.random() * 60,
      y: 80 + Math.floor(idx / cols) * 240 + Math.random() * 60,
      rotation: (Math.random() - 0.5) * 8,
    }));
    await updateItemPositions(updates);
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
    toast("Shuffled ✦", { description: "A new arrangement for a new perspective." });
  };

  if (sectionsLoading || itemsLoading) {
    return (
      <div className="grid h-full place-items-center">
        <ChromeLoader label="Opening section…" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-display text-3xl italic">This corner doesn't exist.</h1>
        <Button asChild variant="glass" className="rounded-full">
          <Link to="/app">Back to the dashboard</Link>
        </Button>
      </div>
    );
  }

  const header = (
    <header className="flex flex-col gap-4 px-6 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {section.icon && <span className="text-3xl">{section.icon}</span>}
            <h1 className="truncate font-display text-3xl text-foreground sm:text-4xl">{section.name}</h1>
            <Button variant="ghost" size="icon-sm" aria-label="Edit section" onClick={() => setEditSection(true)}>
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
          {section.description && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{section.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
            {children.length > 0 && ` · ${children.length} sub-sections`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="chrome" size="sm" className="rounded-full">
                <Plus className="h-4 w-4" strokeWidth={1.5} /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-glass-border">
              <DropdownMenuItem onSelect={() => setCreateType("text")}>
                <Type className="h-4 w-4" strokeWidth={1.5} /> Text, goal or quote
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCreateType("image")}>
                <ImageIcon className="h-4 w-4" strokeWidth={1.5} /> Image
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCreateType("video")}>
                <Video className="h-4 w-4" strokeWidth={1.5} /> Video or embed
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRecording(true)}>
                <Mic className="h-4 w-4 text-accent" strokeWidth={1.5} /> Record voice note
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCreateType("audio")}>
                <Mic className="h-4 w-4" strokeWidth={1.5} /> Upload audio
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCreateType("document")}>
                <FileText className="h-4 w-4" strokeWidth={1.5} /> Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="glass" size="sm" className="rounded-full" onClick={() => void visionShuffle()}>
            <Shuffle className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Vision Shuffle</span>
          </Button>
          <LayoutsMenu sectionId={sectionId} items={items} mode={mode} />
        </div>
      </div>

      {children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.id}
              to="/app/sections/$sectionId"
              params={{ sectionId: c.id }}
              className="glass hover-lift rounded-full px-3 py-1.5 text-xs"
              style={c.color ? { boxShadow: `inset 0 0 0 1px ${c.color}` } : undefined}
            >
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {VIEW_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs transition-all",
              mode === m.id ? "chrome-surface" : "glass text-muted-foreground hover:text-foreground",
            )}
          >
            {m.id === "focus" && <Maximize2 className="mr-1 inline h-3 w-3" strokeWidth={1.5} />}
            {m.label}
          </button>
        ))}
      </div>
    </header>
  );

  const empty = items.length === 0 && (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center animate-fade-up">
      <h2 className="font-display text-2xl italic">An empty sky, waiting for stars.</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Drop images here, write a goal, or record a voice note. Everything you add floats onto this board.
      </p>
      <div className="flex gap-2">
        <Button variant="chrome" className="rounded-full" onClick={() => setCreateType("text")}>
          <Type className="h-4 w-4" strokeWidth={1.5} /> Write something
        </Button>
        <Button variant="glass" className="rounded-full" onClick={() => setRecording(true)}>
          <Mic className="h-4 w-4" strokeWidth={1.5} /> Speak it
        </Button>
      </div>
    </div>
  );

  const grid = (list: VisionItem[]) => (
    <div className="grid grid-cols-1 gap-5 px-6 pb-10 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((it, idx) => (
        <div
          key={`${it.id}-${mode === "random" ? randomSeed : "d"}`}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(idx * 40, 600)}ms`, height: it.type === "audio" ? 160 : 260 }}
        >
          <VisionCard item={it} className="h-full w-full glass rounded-2xl" onOpen={openItem} />
        </div>
      ))}
    </div>
  );

  let body: React.ReactNode;
  if (items.length === 0) body = empty;
  else if (mode === "static")
    body = <BoardCanvas sectionId={sectionId} items={items} onOpen={openItem} />;
  else if (mode === "focus")
    body = (
      <div className="fixed inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="font-display text-xl">
            {section.icon} {section.name} <span className="italic-accent">— focus</span>
          </span>
          <Button variant="glass" size="sm" className="rounded-full" onClick={() => setMode("static")}>
            <X className="h-3.5 w-3.5" /> Exit focus
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          <BoardCanvas sectionId={sectionId} items={items} onOpen={openItem} />
        </div>
      </div>
    );
  else if (mode === "cloud")
    body = (
      <div className="h-[calc(100vh-260px)] min-h-[480px] px-3 pb-4">
        <DreamCloud
          items={items}
          connections={connections}
          onOpen={openItem}
          className="h-full w-full"
          seed={randomSeed}
        />
      </div>
    );
  else if (mode === "timeline")
    body = <TimelineView items={items} onOpen={openItem} className="px-6 pb-10 pt-4" />;
  else if (mode === "mood")
    body = (
      <>
        <div className="flex flex-wrap gap-1.5 px-6 pt-4">
          <button
            type="button"
            onClick={() => setMoodFilter(null)}
            className={cn("rounded-full px-3 py-1 text-xs", !moodFilter ? "bg-rose/25 text-accent" : "glass text-muted-foreground")}
          >
            All moods
          </button>
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMoodFilter(m)}
              className={cn("rounded-full px-3 py-1 text-xs", moodFilter === m ? "bg-rose/25 text-accent" : "glass text-muted-foreground")}
            >
              {m}
            </button>
          ))}
        </div>
        {arranged.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Nothing tagged with this mood yet.</p>
        ) : (
          grid(arranged)
        )}
      </>
    );
  else body = grid(arranged); // random / daily

  return (
    <div className="flex min-h-full flex-col">
      {mode !== "focus" && header}
      {mode === "daily" && items.length > 0 && (
        <p className="px-6 pt-4 text-xs text-muted-foreground">
          Today's manifestation — this arrangement is yours until midnight.
        </p>
      )}
      {body}

      <CreateItemDialog
        sectionId={sectionId}
        type={createType ?? "text"}
        open={createType !== null}
        onOpenChange={(o) => !o && setCreateType(null)}
      />
      <VoiceRecorder sectionId={sectionId} open={recording} onOpenChange={setRecording} zIndex={nextZ} />
      <ItemDrawer item={activeItem} open={!!search.item} onOpenChange={(o) => !o && closeItem()} />
      <SectionDialog open={editSection} onOpenChange={setEditSection} section={section} />
    </div>
  );
}
