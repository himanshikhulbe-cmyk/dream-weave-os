import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Pin, Lock, Trash2, Copy, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisionCard } from "@/components/vision/cards/VisionCard";
import { RichTextEditor } from "./RichTextEditor";
import {
  allItemsQuery,
  connectionsQuery,
  createConnection,
  deleteConnection,
  deleteItem,
  duplicateItem,
  keys,
  sectionsQuery,
  touchItem,
  updateItem,
} from "@/lib/vision/api";
import {
  MOODS,
  PRIORITY_LABELS,
  SECTION_COLORS,
  STATUSES,
  TEXT_KINDS,
  type ItemStatus,
  type TextKind,
  type VisionItem,
  type VisionItemUpdate,
} from "@/lib/vision/types";
import { cn } from "@/lib/utils";

interface Draft {
  title: string;
  body: string;
  caption: string;
  notes: string;
  tags: string;
  moods: string[];
  status: ItemStatus;
  progress: number;
  deadline: string;
  target_year: string;
  priority: number;
  color: string | null;
  text_kind: TextKind | null;
  pinned: boolean;
  locked: boolean;
  section_id: string | null;
}

function toDraft(item: VisionItem): Draft {
  return {
    title: item.title ?? "",
    body: item.body ?? "",
    caption: item.caption ?? "",
    notes: item.notes ?? "",
    tags: (item.tags ?? []).join(", "),
    moods: item.moods ?? [],
    status: item.status,
    progress: item.progress ?? 0,
    deadline: item.deadline ? item.deadline.slice(0, 10) : "",
    target_year: item.target_year ? String(item.target_year) : "",
    priority: item.priority ?? 0,
    color: item.color,
    text_kind: item.text_kind,
    pinned: item.pinned,
    locked: item.locked,
    section_id: item.section_id,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
  tone = "chrome",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "chrome" | "rose" | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] transition-colors",
        active
          ? tone === "rose"
            ? "bg-rose/25 text-accent"
            : "chrome-surface"
          : "glass text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ItemDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: VisionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: allItems = [] } = useQuery(allItemsQuery);
  const { data: connections = [] } = useQuery(connectionsQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [linkTarget, setLinkTarget] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  useEffect(() => {
    if (item) {
      setDraft(toDraft(item));
      void touchItem(item.id);
    } else {
      setDraft(null);
    }
  }, [item]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["items"] });
    void queryClient.invalidateQueries({ queryKey: keys.connections });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!item || !draft) return;
      const patch: VisionItemUpdate = {
        title: draft.title || null,
        body: item.type === "text" ? draft.body : item.body,
        caption: draft.caption || null,
        notes: draft.notes || null,
        tags: draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        moods: draft.moods,
        status: draft.status,
        progress: draft.progress,
        deadline: draft.deadline ? new Date(draft.deadline).toISOString() : null,
        target_year: draft.target_year ? Number(draft.target_year) : null,
        priority: draft.priority,
        color: draft.color,
        text_kind: item.type === "text" ? draft.text_kind : null,
        pinned: draft.pinned,
        locked: draft.locked,
        section_id: draft.section_id,
      };
      await updateItem(item.id, patch);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await deleteItem(item.id);
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
      toast.success("Removed from your universe");
    },
  });

  const clone = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await duplicateItem(item);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Duplicated");
    },
  });

  const link = useMutation({
    mutationFn: async () => {
      if (!item || !linkTarget) return;
      await createConnection(item.id, linkTarget, linkLabel || undefined);
    },
    onSuccess: () => {
      invalidate();
      setLinkTarget("");
      setLinkLabel("");
      toast.success("Connected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlink = useMutation({
    mutationFn: deleteConnection,
    onSuccess: invalidate,
  });

  const itemById = useMemo(() => new Map(allItems.map((i) => [i.id, i] as const)), [allItems]);
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s] as const)), [sections]);
  const myConnections = useMemo(
    () => (item ? connections.filter((c) => c.from_item_id === item.id || c.to_item_id === item.id) : []),
    [connections, item],
  );

  const previewItem: VisionItem | null =
    item && draft
      ? {
          ...item,
          title: draft.title || null,
          body: item.type === "text" ? draft.body : item.body,
          caption: draft.caption || null,
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          moods: draft.moods,
          status: draft.status,
          progress: draft.progress,
          text_kind: item.type === "text" ? draft.text_kind : null,
          pinned: draft.pinned,
          locked: draft.locked,
          color: draft.color,
        }
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-strong flex w-full flex-col gap-0 overflow-hidden border-glass-border p-0 sm:max-w-xl"
      >
        {item && draft && previewItem && (
          <>
            <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-glass-border px-5 py-3">
              <SheetTitle className="font-display text-lg">
                {TEXT_KINDS.find((k) => k.id === draft.text_kind)?.label ??
                  item.type[0]!.toUpperCase() + item.type.slice(1)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {sectionById.get(item.section_id ?? "")?.name}
                </span>
              </SheetTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Duplicate" onClick={() => clone.mutate()}>
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this from your universe?")) remove.mutate();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="mx-auto mb-5 max-w-sm" style={{ height: item.type === "audio" ? 160 : 260 }}>
                <VisionCard item={previewItem} className="h-full w-full" />
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Title">
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </Field>

                {item.type === "text" && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_KINDS.map((k) => (
                        <Chip key={k.id} active={draft.text_kind === k.id} onClick={() => setDraft({ ...draft, text_kind: k.id })}>
                          {k.label}
                        </Chip>
                      ))}
                    </div>
                    <RichTextEditor
                      value={draft.body}
                      onChange={(html) => setDraft((d) => (d ? { ...d, body: html } : d))}
                    />
                  </>
                )}

                {(item.type === "image" || item.type === "video") && (
                  <Field label="Caption">
                    <Input value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
                  </Field>
                )}

                <Field label="Notes">
                  <Textarea
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    placeholder="Why this matters, next steps…"
                  />
                </Field>

                <Field label="Tags (comma separated)">
                  <Input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="research, phd, 2027" />
                </Field>

                <Field label="Moods">
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => (
                      <Chip
                        key={m}
                        tone="rose"
                        active={draft.moods.includes(m)}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            moods: draft.moods.includes(m) ? draft.moods.filter((x) => x !== m) : [...draft.moods, m],
                          })
                        }
                      >
                        {m}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Status">
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <Chip key={s.id} active={draft.status === s.id} onClick={() => setDraft({ ...draft, status: s.id })}>
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <Field label={`Progress · ${draft.progress}%`}>
                  <Slider
                    value={[draft.progress]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(v) => setDraft({ ...draft, progress: v[0] ?? 0 })}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Deadline">
                    <Input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
                  </Field>
                  <Field label="Target year">
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={draft.target_year}
                      onChange={(e) => setDraft({ ...draft, target_year: e.target.value })}
                      placeholder="2030"
                    />
                  </Field>
                </div>

                <Field label="Priority">
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORITY_LABELS.map((p, i) => (
                      <Chip key={p} active={draft.priority === i} onClick={() => setDraft({ ...draft, priority: i })}>
                        {p}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Accent color">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label="No color"
                      onClick={() => setDraft({ ...draft, color: null })}
                      className={cn("grid h-6 w-6 place-items-center rounded-full glass", !draft.color && "ring-2 ring-accent")}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {SECTION_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label="Pick color"
                        onClick={() => setDraft({ ...draft, color: c })}
                        className={cn("h-6 w-6 rounded-full transition-transform hover:scale-110", draft.color === c && "ring-2 ring-accent")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Section">
                  <Select value={draft.section_id ?? ""} onValueChange={(v) => setDraft({ ...draft, section_id: v || null })}>
                    <SelectTrigger className="glass border-glass-border">
                      <SelectValue placeholder="Move to…" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-glass-border">
                      {sections
                        .filter((s) => !s.archived)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.icon ? `${s.icon} ` : ""}
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex items-center justify-between gap-4 rounded-2xl glass px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <Pin className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} /> Pinned
                  </span>
                  <Switch checked={draft.pinned} onCheckedChange={(v) => setDraft({ ...draft, pinned: v })} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl glass px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} /> Locked in place
                  </span>
                  <Switch checked={draft.locked} onCheckedChange={(v) => setDraft({ ...draft, locked: v })} />
                </div>

                {/* Connections */}
                <div className="flex flex-col gap-2 rounded-2xl glass p-3.5">
                  <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Connections
                  </p>
                  {myConnections.length === 0 && (
                    <p className="text-xs text-muted-foreground">Not connected to anything yet.</p>
                  )}
                  {myConnections.map((c) => {
                    const otherId = c.from_item_id === item.id ? c.to_item_id : c.from_item_id;
                    const other = itemById.get(otherId);
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">
                          {other?.title ?? other?.type ?? "Unknown"}
                          {c.label && <span className="ml-1.5 text-xs italic text-muted-foreground">— {c.label}</span>}
                        </span>
                        <button
                          type="button"
                          aria-label="Remove connection"
                          className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                          onClick={() => unlink.mutate(c.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  <div className="mt-1 flex flex-col gap-1.5 sm:flex-row">
                    <Select value={linkTarget} onValueChange={setLinkTarget}>
                      <SelectTrigger className="glass border-glass-border text-xs">
                        <SelectValue placeholder="Connect to a dream…" />
                      </SelectTrigger>
                      <SelectContent className="glass-strong max-h-64 border-glass-border">
                        {allItems
                          .filter((i) => i.id !== item.id)
                          .map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              <span className="text-xs">
                                {i.title ?? i.type}
                                <span className="ml-1 text-muted-foreground">
                                  · {sectionById.get(i.section_id ?? "")?.name ?? ""}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-9 text-xs sm:w-32"
                      placeholder="Label"
                      value={linkLabel}
                      onChange={(e) => setLinkLabel(e.target.value)}
                    />
                    <Button
                      variant="glass"
                      size="sm"
                      className="rounded-full"
                      disabled={!linkTarget || link.isPending}
                      onClick={() => link.mutate()}
                    >
                      Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-glass-border px-5 py-3">
              <span className="text-[11px] text-muted-foreground">
                Added {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <Button variant="chrome" size="sm" className="rounded-full" onClick={() => save.mutate()} disabled={save.isPending}>
                <Check className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
